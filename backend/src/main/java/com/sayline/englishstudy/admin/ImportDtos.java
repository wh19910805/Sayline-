package com.sayline.englishstudy.admin;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public final class ImportDtos {

    private ImportDtos() {
    }

    public record ImportItemRequest(
        @NotBlank @Size(max = 255) String sourceName,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 32) String audioMd5,
        @Size(max = 32) String subtitleMd5,
        @Size(max = 255) String audioObjectKey,
        @Size(max = 255) String subtitleObjectKey,
        Long courseId,
        @Min(0) long durationMs
    ) {
    }

    public record ImportPreviewRequest(
        ImportType type,
        Long bookId,
        @NotEmpty List<@Valid ImportItemRequest> items
    ) {
    }

    public record ImportExecuteRequest(
        ImportType type,
        Long bookId,
        boolean resetLearning,
        @NotEmpty List<@Valid ImportItemRequest> items
    ) {
    }

    public record ImportItemView(
        int index,
        String sourceName,
        String title,
        ImportItemStatus status,
        String reason,
        Long courseId,
        String courseTitle,
        String bookTitle,
        String previousSubtitleObjectKey,
        String error
    ) {
    }

    public record ImportPreviewView(
        int total,
        int ready,
        int skipped,
        int invalid,
        List<ImportItemView> items
    ) {
    }

    public record ImportJobView(
        Long id,
        ImportType type,
        ImportStatus status,
        Long bookId,
        int total,
        int success,
        int skipped,
        int failed,
        Instant createdAt,
        Instant updatedAt,
        List<ImportItemView> items
    ) {
    }
}
