package com.sayline.englishstudy.catalog;

import java.time.Instant;
import java.util.List;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CategoryView(
        Long id,
        String name,
        String description,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary
    ) {
    }

    public record CourseSummary(
        Long id,
        Long bookId,
        String title,
        String description,
        Long categoryId,
        String categoryName,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        long durationMs,
        int progress,
        String lastCueText,
        int lastCueSequenceNo,
        long remainingDurationMs,
        boolean favorite
    ) {
    }

    public record BookSummary(
        Long id,
        String title,
        String description,
        Long categoryId,
        String categoryName,
        String coverUrl,
        String coverThumbnailUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        String spineColor,
        int lessonCount,
        int progress,
        boolean favorite
    ) {
    }

    public record BookDetail(
        Long id,
        String title,
        String description,
        Long categoryId,
        String categoryName,
        String coverUrl,
        String coverThumbnailUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        String spineColor,
        int lessonCount,
        int progress,
        boolean favorite,
        List<CourseSummary> lessons
    ) {
    }

    public record CueView(
        Long id,
        int sequenceNo,
        long startMs,
        long endMs,
        String englishText,
        String chineseText
    ) {
    }

    public record CourseDetail(
        Long id,
        String title,
        String description,
        Long categoryId,
        String categoryName,
        String coverUrl,
        String audioUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        long durationMs,
        boolean favorite,
        List<CueView> cues
    ) {
    }

    public record RecentLesson(
        Long id,
        Long bookId,
        String title,
        String bookTitle,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        int progress,
        Instant lastStudiedAt
    ) {
    }

    public record CueSearchResult(
        Long cueId,
        Long courseId,
        Long bookId,
        String courseTitle,
        String bookTitle,
        int sequenceNo,
        long startMs,
        String englishText,
        String chineseText
    ) {
    }

    public record SearchResponse(
        List<BookSummary> books,
        List<CourseSummary> lessons,
        List<CueSearchResult> cues
    ) {
    }

    public record FavoriteState(boolean favorited) {
    }
}
