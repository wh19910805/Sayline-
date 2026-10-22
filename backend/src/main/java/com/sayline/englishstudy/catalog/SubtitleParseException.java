package com.sayline.englishstudy.catalog;

import lombok.Getter;

@Getter
public class SubtitleParseException extends RuntimeException {

    private final int lineNumber;

    public SubtitleParseException(int lineNumber, String message) {
        super("第 " + lineNumber + " 行：" + message);
        this.lineNumber = lineNumber;
    }
}
