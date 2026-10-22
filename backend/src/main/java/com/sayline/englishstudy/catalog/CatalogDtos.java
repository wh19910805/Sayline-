package com.sayline.englishstudy.catalog;

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
        String title,
        String description,
        Long categoryId,
        String categoryName,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        long durationMs,
        int progress,
        boolean favorite
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

    public record FavoriteState(boolean favorited) {
    }
}
