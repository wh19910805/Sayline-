package com.sayline.englishstudy.user;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserProfileDtos {

    private UserProfileDtos() {
    }

    public record ProfileView(Long id, String phone, String nickname, String avatarUrl) {
    }

    public record ProfileUpdate(
        @NotBlank @Size(max = 50) String nickname,
        @Size(max = 255) String avatarObjectKey
    ) {
    }

    public record SettingsView(
        BigDecimal fontScale,
        String subtitleColor,
        BigDecimal playbackRate,
        boolean showChineseListen,
        boolean showChineseRead,
        boolean showChineseWrite,
        boolean showChineseSpeak,
        int dailyGoalMinutes,
        Long defaultCategoryId
    ) {
    }

    public record SettingsUpdate(
        @DecimalMin("0.8") @DecimalMax("1.8") BigDecimal fontScale,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "颜色需为 6 位十六进制色值") String subtitleColor,
        @DecimalMin("0.25") @DecimalMax("2.0") BigDecimal playbackRate,
        Boolean showChineseListen,
        Boolean showChineseRead,
        Boolean showChineseWrite,
        Boolean showChineseSpeak,
        @Min(1) @Max(240) Integer dailyGoalMinutes,
        Long defaultCategoryId
    ) {
    }

    public record InterestsUpdate(List<Long> categoryIds) {
    }
}
