package com.sayline.englishstudy.learning;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.sayline.englishstudy.learning.LearningDtos.DayStat;
import com.sayline.englishstudy.learning.LearningDtos.StatsResponse;
import com.sayline.englishstudy.learning.LearningDtos.StatsSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningStatsService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");

    private final LearningDailyStatRepository dailyStatRepository;
    private final DictationAttemptRepository dictationRepository;
    private final LearningCueProgressRepository cueProgressRepository;

    public LearningStatsService(
        LearningDailyStatRepository dailyStatRepository,
        DictationAttemptRepository dictationRepository,
        LearningCueProgressRepository cueProgressRepository
    ) {
        this.dailyStatRepository = dailyStatRepository;
        this.dictationRepository = dictationRepository;
        this.cueProgressRepository = cueProgressRepository;
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(Long userId, String period, LocalDate anchor) {
        LocalDate date = anchor == null ? LocalDate.now(APP_ZONE) : anchor;
        boolean month = "MONTH".equalsIgnoreCase(period);
        LocalDate start = month
            ? date.with(TemporalAdjusters.firstDayOfMonth())
            : date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = month
            ? date.with(TemporalAdjusters.lastDayOfMonth())
            : start.plusDays(6);

        Map<LocalDate, DayAggregate> byDate = dailyStatRepository
            .findByUserIdAndStatDateBetween(userId, start, end).stream()
            .collect(Collectors.groupingBy(
                LearningDailyStat::getStatDate,
                Collectors.collectingAndThen(Collectors.toList(), items -> new DayAggregate(
                    items.stream().mapToInt(LearningDailyStat::getSessionCount).sum(),
                    items.stream().mapToLong(LearningDailyStat::getStudyMs).sum()))));
        List<DayStat> days = IntStream.rangeClosed(0, (int) (end.toEpochDay() - start.toEpochDay()))
            .mapToObj(offset -> start.plusDays(offset))
            .map(day -> {
                DayAggregate aggregate = byDate.getOrDefault(day, new DayAggregate(0, 0));
                return new DayStat(day, aggregate.studyMs() > 0, aggregate.sessions(), aggregate.studyMs());
            })
            .toList();

        int studyDays = (int) days.stream().filter(DayStat::active).count();
        int sessions = days.stream().mapToInt(DayStat::sessions).sum();
        long studyMs = days.stream().mapToLong(DayStat::studyMs).sum();
        long attempts = dictationRepository.countByUserId(userId);
        long correct = dictationRepository.countByUserIdAndCorrectTrue(userId);
        int dictationAccuracy = attempts == 0 ? 0 : (int) Math.round(correct * 100.0 / attempts);
        long speakingCount = cueProgressRepository.countByUserIdAndSpokenTrue(userId);

        return new StatsResponse(
            start,
            end,
            days,
            new StatsSummary(studyDays, sessions, studyMs, dictationAccuracy, speakingCount));
    }

    private record DayAggregate(int sessions, long studyMs) {
    }
}
