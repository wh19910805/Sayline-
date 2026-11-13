package com.sayline.englishstudy.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.user.UserRole;
import com.sayline.englishstudy.user.UserStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record CategoryRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 300) String description,
        @Size(max = 255) String coverObjectKey,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String themeColorPrimary,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String themeColorSecondary,
        @Min(0) int sortOrder,
        boolean visible
    ) {
    }

    public record CategoryAdminView(
        Long id,
        String name,
        String description,
        String coverObjectKey,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        int sortOrder,
        boolean visible
    ) {
    }

    public record BookRequest(
        @NotNull Long categoryId,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        @Size(max = 255) String coverObjectKey,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String themeColorPrimary,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String themeColorSecondary,
        @Min(0) int sortOrder,
        boolean visible
    ) {
    }

    public record BookAdminView(
        Long id,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String coverObjectKey,
        String coverUrl,
        String themeColorPrimary,
        String themeColorSecondary,
        int sortOrder,
        boolean visible,
        Instant updatedAt
    ) {
    }

    public record CourseRequest(
        @NotNull Long bookId,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        @Size(max = 255) String coverObjectKey,
        @Size(max = 255) String audioObjectKey,
        @Size(max = 255) String subtitleObjectKey,
        String themeColorPrimary,
        String themeColorSecondary,
        @Min(0) long durationMs,
        @Min(0) int sortOrder,
        boolean resetLearning
    ) {
    }

    public record CourseAdminView(
        Long id,
        Long bookId,
        String bookName,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String coverObjectKey,
        String coverUrl,
        String audioObjectKey,
        String subtitleObjectKey,
        String themeColorPrimary,
        String themeColorSecondary,
        long durationMs,
        int sortOrder,
        CourseStatus status,
        Instant publishedAt,
        Instant updatedAt
    ) {
    }

    public record UserStatusRequest(@NotNull UserStatus status) {
    }

    public record BatchVisibilityRequest(
        @NotNull List<Long> bookIds,
        boolean visible
    ) {
    }

    public record BatchCourseStatusRequest(
        @NotEmpty List<Long> courseIds,
        @NotNull CourseStatus status
    ) {
    }

    public record UserAdminView(
        Long id,
        String phone,
        String nickname,
        UserRole role,
        UserStatus status,
        Instant createdAt,
        Instant lastLoginAt
    ) {
    }

    public record DashboardView(
        long totalLearners,
        long activeToday,
        long activeYesterday,
        long totalPublishedCourses,
        long courseStarts,
        long completedCourses,
        int completionRate,
        long totalStudyMs,
        long thisWeekStudyMs,
        long previousWeekStudyMs,
        int dictationAccuracy,
        long speakingCount,
        List<DailyStudyPoint> studyTrend
    ) {
    }

    public record DailyStudyPoint(
        LocalDate date,
        long studyMs,
        long learners
    ) {
    }
}
