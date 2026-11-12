package com.sayline.englishstudy.learning;

import java.time.Instant;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewCue(
        Long bookId,
        Long courseId,
        Long cueId,
        String bookTitle,
        String courseTitle,
        int sequenceNo,
        String englishText,
        String chineseText,
        String lastAnswer,
        int wrongCount,
        Instant lastWrongAt
    ) {
    }
}
