package com.sayline.englishstudy.catalog;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class SubtitleParser {

    private static final Pattern TIMESTAMP = Pattern.compile(
        "^(?:(\\d{2}):)?(\\d{2}):(\\d{2})[,.](\\d{3})$");
    private static final Pattern TIMING_LINE = Pattern.compile("^(.+?)\\s+-->\\s+(.+?)(?:\\s+.*)?$");
    private static final Pattern HAN = Pattern.compile("[\\u4e00-\\u9fff]");

    public List<ParsedSubtitleCue> parse(String content, String fileName) {
        if (content == null || content.isBlank()) {
            throw new SubtitleParseException(1, "字幕文件为空");
        }
        String[] rawLines = content.replace("\uFEFF", "").split("\\R", -1);
        boolean vtt = fileName != null && fileName.toLowerCase().endsWith(".vtt")
            || rawLines.length > 0 && rawLines[0].trim().startsWith("WEBVTT");
        if (!vtt && (fileName == null || !fileName.toLowerCase().endsWith(".srt"))) {
            throw new SubtitleParseException(1, "仅支持 SRT 或 VTT 字幕");
        }

        List<ParsedSubtitleCue> cues = new ArrayList<>();
        int index = 0;
        while (index < rawLines.length) {
            index = skipBlankLines(rawLines, index);
            if (index >= rawLines.length) {
                break;
            }
            int blockStart = index;
            if (vtt && rawLines[index].trim().startsWith("WEBVTT")) {
                index++;
                continue;
            }
            if (!rawLines[index].contains("-->") && index + 1 < rawLines.length
                && rawLines[index + 1].contains("-->")) {
                index++;
            } else if (!rawLines[index].contains("-->") && rawLines[index].matches("\\d+")) {
                index++;
            }
            if (index >= rawLines.length || !rawLines[index].contains("-->")) {
                throw new SubtitleParseException(blockStart + 1, "缺少有效时间轴");
            }

            int timingLineNumber = index + 1;
            Matcher timingMatcher = TIMING_LINE.matcher(rawLines[index].trim());
            if (!timingMatcher.matches()) {
                throw new SubtitleParseException(timingLineNumber, "时间轴格式不正确");
            }
            long startMs = parseTimestamp(timingMatcher.group(1), timingLineNumber);
            long endMs = parseTimestamp(timingMatcher.group(2), timingLineNumber);
            if (startMs >= endMs) {
                throw new SubtitleParseException(timingLineNumber, "开始时间必须小于结束时间");
            }

            index++;
            List<String> textLines = new ArrayList<>();
            while (index < rawLines.length && !rawLines[index].isBlank()) {
                textLines.add(rawLines[index].trim());
                index++;
            }
            if (textLines.size() != 2) {
                throw new SubtitleParseException(
                    timingLineNumber + textLines.size() + 1,
                    "每条字幕必须包含英文和中文两行");
            }
            if (!cues.isEmpty() && startMs < cues.getLast().endMs()) {
                throw new SubtitleParseException(timingLineNumber, "字幕时间轴不能重叠");
            }
            String first = textLines.get(0);
            String second = textLines.get(1);
            boolean firstIsChinese = hanCount(first) > hanCount(second);
            cues.add(new ParsedSubtitleCue(
                cues.size() + 1,
                startMs,
                endMs,
                firstIsChinese ? second : first,
                firstIsChinese ? first : second));
        }

        if (cues.isEmpty()) {
            throw new SubtitleParseException(1, "字幕文件不包含有效句子");
        }
        return cues;
    }

    private int skipBlankLines(String[] lines, int index) {
        while (index < lines.length && lines[index].isBlank()) {
            index++;
        }
        return index;
    }

    private long hanCount(String text) {
        long count = 0;
        Matcher matcher = HAN.matcher(text);
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private long parseTimestamp(String value, int lineNumber) {
        Matcher matcher = TIMESTAMP.matcher(value.trim());
        if (!matcher.matches()) {
            throw new SubtitleParseException(lineNumber, "时间格式不正确");
        }
        long hours = matcher.group(1) == null ? 0 : Long.parseLong(matcher.group(1));
        long minutes = Long.parseLong(matcher.group(2));
        long seconds = Long.parseLong(matcher.group(3));
        long millis = Long.parseLong(matcher.group(4));
        if (minutes > 59 || seconds > 59) {
            throw new SubtitleParseException(lineNumber, "时间格式不正确");
        }
        return ((hours * 60 + minutes) * 60 + seconds) * 1_000 + millis;
    }
}
