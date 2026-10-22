package com.sayline.englishstudy.learning;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public final class LearningDtos {

    private LearningDtos() {
    }

    public record ActionRequest(
        @NotNull Long cueId,
        @NotNull LearningMode mode,
        @Min(0) long durationMs,
        String answer
    ) {
    }

    public record PositionRequest(
        @NotNull LearningMode mode,
        Long cueId,
        @Min(0) long positionMs
    ) {
    }

    public record ConfirmRequest(@NotNull LearningMode mode) {
    }

    public record HeartbeatRequest(@Min(1) long activeMs) {
    }

    public record ModeState(int progress, boolean confirmed) {
    }

    public record ModesState(
        ModeState listen,
        ModeState read,
        ModeState write,
        ModeState speak
    ) {
    }

    public record CueState(
        Long cueId,
        boolean heard,
        boolean read,
        boolean written,
        boolean spoken
    ) {
    }

    public record LearningState(
        LearningMode lastMode,
        Long lastCueId,
        long lastPositionMs,
        ModesState modes,
        List<CueState> cues,
        boolean completed
    ) {
    }

    public record HeartbeatResponse(String sessionId, long sessionActiveMs, boolean sessionCounted) {
    }

    public record DayStat(LocalDate date, boolean active, int sessions, long studyMs) {
    }

    public record StatsSummary(int studyDays, int sessions, long studyMs, int dictationAccuracy, long speakingCount) {
    }

    public record StatsResponse(
        LocalDate rangeStart,
        LocalDate rangeEnd,
        List<DayStat> days,
        StatsSummary summary
    ) {
    }
}
