package com.sayline.englishstudy.catalog;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SubtitleParserTest {

    private final SubtitleParser parser = new SubtitleParser();

    @Test
    void parsesBilingualSrtInOrder() {
        var cues = parser.parse("""
            1
            00:00:00,000 --> 00:00:02,500
            Good morning.
            早上好。

            2
            00:00:02,500 --> 00:00:05,000
            How can I help?
            有什么可以帮您？
            """, "lesson.srt");

        assertThat(cues).hasSize(2);
        assertThat(cues.getFirst().startMs()).isZero();
        assertThat(cues.getFirst().endMs()).isEqualTo(2_500);
        assertThat(cues.getFirst().englishText()).isEqualTo("Good morning.");
        assertThat(cues.getLast().chineseText()).isEqualTo("有什么可以帮您？");
    }

    @Test
    void parsesWebVttWithShortTimestamps() {
        var cues = parser.parse("""
            WEBVTT

            00:01.000 --> 00:03.500
            Let's get started.
            我们开始吧。
            """, "lesson.vtt");

        assertThat(cues).singleElement()
            .satisfies(cue -> {
                assertThat(cue.startMs()).isEqualTo(1_000);
                assertThat(cue.endMs()).isEqualTo(3_500);
            });
    }

    @Test
    void rejectsInvalidTimestampRange() {
        assertThatThrownBy(() -> parser.parse("""
            1
            00:00:05,000 --> 00:00:02,000
            Too late.
            太晚了。
            """, "lesson.srt"))
            .isInstanceOf(SubtitleParseException.class)
            .hasMessageContaining("第 2 行");
    }

    @Test
    void rejectsCueWithoutBothEnglishAndChineseLines() {
        assertThatThrownBy(() -> parser.parse("""
            1
            00:00:00,000 --> 00:00:02,000
            Only English.
            """, "lesson.srt"))
            .isInstanceOf(SubtitleParseException.class)
            .hasMessageContaining("第 4 行");
    }

    @Test
    void rejectsOverlappingCues() {
        assertThatThrownBy(() -> parser.parse("""
            1
            00:00:00,000 --> 00:00:03,000
            First.
            第一句。

            2
            00:00:02,000 --> 00:00:04,000
            Second.
            第二句。
            """, "lesson.srt"))
            .isInstanceOf(SubtitleParseException.class)
            .hasMessageContaining("重叠");
    }
}
