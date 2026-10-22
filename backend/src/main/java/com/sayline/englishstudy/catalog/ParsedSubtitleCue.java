package com.sayline.englishstudy.catalog;

public record ParsedSubtitleCue(
    int sequenceNo,
    long startMs,
    long endMs,
    String englishText,
    String chineseText
) {
}
