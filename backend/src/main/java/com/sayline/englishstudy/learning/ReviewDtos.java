package com.sayline.englishstudy.learning;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

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
        Instant lastWrongAt,
        ReviewStatus status,
        Instant nextReviewAt,
        boolean due
    ) {
    }

    public record ReviewStateRequest(
        @NotNull ReviewStatus status,
        Instant nextReviewAt
    ) {
    }
}
