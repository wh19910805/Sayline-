package com.sayline.englishstudy.learning;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.sayline.englishstudy.auth.AuthenticatedUser;
import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.learning.LearningDtos.ActionRequest;
import com.sayline.englishstudy.learning.LearningDtos.ConfirmRequest;
import com.sayline.englishstudy.learning.LearningDtos.CueState;
import com.sayline.englishstudy.learning.LearningDtos.HeartbeatRequest;
import com.sayline.englishstudy.learning.LearningDtos.HeartbeatResponse;
import com.sayline.englishstudy.learning.LearningDtos.LearningState;
import com.sayline.englishstudy.learning.LearningDtos.ModeState;
import com.sayline.englishstudy.learning.LearningDtos.ModesState;
import com.sayline.englishstudy.learning.LearningDtos.PositionRequest;
import com.sayline.englishstudy.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");
    private static final Duration INACTIVITY_WINDOW = Duration.ofMinutes(10);
    private static final long SESSION_COUNT_THRESHOLD_MS = 30_000;

    private final CourseRepository courseRepository;
    private final SubtitleCueRepository cueRepository;
    private final LearningRecordRepository recordRepository;
    private final LearningCueProgressRepository cueProgressRepository;
    private final DictationAttemptRepository dictationRepository;
    private final LearningDailyStatRepository dailyStatRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;

    public LearningService(
        CourseRepository courseRepository,
        SubtitleCueRepository cueRepository,
        LearningRecordRepository recordRepository,
        LearningCueProgressRepository cueProgressRepository,
        DictationAttemptRepository dictationRepository,
        LearningDailyStatRepository dailyStatRepository,
        StudySessionRepository sessionRepository,
        UserRepository userRepository
    ) {
        this.courseRepository = courseRepository;
        this.cueRepository = cueRepository;
        this.recordRepository = recordRepository;
        this.cueProgressRepository = cueProgressRepository;
        this.dictationRepository = dictationRepository;
        this.dailyStatRepository = dailyStatRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public LearningState state(AuthenticatedUser user, Long courseId) {
        Course course = publishedCourse(courseId);
        LearningRecord record = recordRepository.findByUserIdAndCourseId(user.id(), courseId)
            .orElseGet(() -> new LearningRecord());
        return state(user.id(), course, record);
    }

    @Transactional
    public LearningState performAction(AuthenticatedUser user, Long courseId, ActionRequest request) {
        Course course = publishedCourse(courseId);
        SubtitleCue cue = cueRepository.findById(request.cueId())
            .filter(item -> item.getCourse().getId().equals(courseId))
            .orElseThrow(() -> new ApiException("CUE_NOT_FOUND", HttpStatus.NOT_FOUND, "字幕句子不存在"));
        LearningCueProgress progress = cueProgressRepository.findByUserIdAndCueId(user.id(), cue.getId())
            .orElseGet(() -> newCueProgress(user, course, cue));

        switch (request.mode()) {
            case LISTEN -> progress.setHeard(progress.isHeard() || request.durationMs() >= 1_000);
            case READ -> progress.setRead(progress.isRead() || request.durationMs() >= 1_000);
            case SPEAK -> progress.setSpoken(progress.isSpoken() || request.durationMs() >= 1_000);
            case WRITE -> {
                String answer = request.answer() == null ? "" : request.answer().trim();
                if (!answer.isBlank()) {
                    progress.setWritten(true);
                    DictationAttempt attempt = new DictationAttempt();
                    attempt.setUser(userRepository.getReferenceById(user.id()));
                    attempt.setCourse(course);
                    attempt.setCue(cue);
                    attempt.setAnswerText(answer);
                    attempt.setCorrect(normalize(answer).equals(normalize(cue.getEnglishText())));
                    dictationRepository.save(attempt);
                }
            }
        }
        cueProgressRepository.save(progress);

        LearningRecord record = findOrCreateRecord(user, course);
        record.setLastMode(request.mode());
        record.setLastCue(cue);
        refreshProgress(record, user.id(), course);
        return state(user.id(), course, record);
    }

    @Transactional
    public LearningState updatePosition(AuthenticatedUser user, Long courseId, PositionRequest request) {
        Course course = publishedCourse(courseId);
        LearningRecord record = findOrCreateRecord(user, course);
        record.setLastMode(request.mode());
        record.setLastPositionMs(request.positionMs());
        if (request.cueId() != null) {
            record.setLastCue(cueRepository.findById(request.cueId())
                .filter(cue -> cue.getCourse().getId().equals(courseId))
                .orElseThrow(() -> new ApiException("CUE_NOT_FOUND", HttpStatus.NOT_FOUND, "字幕句子不存在")));
        }
        return state(user.id(), course, record);
    }

    @Transactional
    public LearningState confirmMode(AuthenticatedUser user, Long courseId, ConfirmRequest request) {
        Course course = publishedCourse(courseId);
        LearningRecord record = findOrCreateRecord(user, course);
        refreshProgress(record, user.id(), course);
        int progress = progress(record, request.mode());
        if (progress < 100) {
            throw new ApiException("MODE_NOT_COMPLETE", HttpStatus.CONFLICT, "本环节尚未完成");
        }
        setConfirmed(record, request.mode());
        if (allModesComplete(record) && record.getCompletedAt() == null) {
            record.setCompletedAt(Instant.now());
        }
        return state(user.id(), course, record);
    }

    @Transactional
    public HeartbeatResponse heartbeat(AuthenticatedUser user, Long courseId, HeartbeatRequest request) {
        Course course = publishedCourse(courseId);
        Instant now = Instant.now();
        StudySession session = sessionRepository.findFirstByUserIdAndCourseIdOrderByLastActiveAtDesc(
                user.id(), courseId)
            .filter(existing -> existing.getLastActiveAt().isAfter(now.minus(INACTIVITY_WINDOW)))
            .orElseGet(() -> newSession(user, course, now));
        session.setLastActiveAt(now);
        session.setActiveMs(session.getActiveMs() + Math.min(request.activeMs(), 60_000));

        LearningRecord record = findOrCreateRecord(user, course);
        record.setTotalStudyMs(record.getTotalStudyMs() + Math.min(request.activeMs(), 60_000));
        record.setLastStudiedAt(now);

        LocalDate today = LocalDate.now(APP_ZONE);
        LearningDailyStat dailyStat = dailyStatRepository
            .findByUserIdAndCourseIdAndStatDate(user.id(), courseId, today)
            .orElseGet(() -> newDailyStat(user, course, today));
        dailyStat.setStudyMs(dailyStat.getStudyMs() + Math.min(request.activeMs(), 60_000));

        if (!session.isCounted() && session.getActiveMs() >= SESSION_COUNT_THRESHOLD_MS) {
            session.setCounted(true);
            dailyStat.setSessionCount(dailyStat.getSessionCount() + 1);
        }
        sessionRepository.save(session);
        dailyStatRepository.save(dailyStat);
        return new HeartbeatResponse(session.getId(), session.getActiveMs(), session.isCounted());
    }

    private LearningState state(Long userId, Course course, LearningRecord record) {
        Map<Long, LearningCueProgress> progressByCue = cueProgressRepository
            .findByUserIdAndCourseId(userId, course.getId()).stream()
            .collect(Collectors.toMap(item -> item.getCue().getId(), Function.identity()));
        List<CueState> cues = cueRepository.findByCourseIdOrderBySequenceNoAsc(course.getId()).stream()
            .map(cue -> {
                LearningCueProgress progress = progressByCue.get(cue.getId());
                return new CueState(
                    cue.getId(),
                    progress != null && progress.isHeard(),
                    progress != null && progress.isRead(),
                    progress != null && progress.isWritten(),
                    progress != null && progress.isSpoken());
            })
            .toList();
        return new LearningState(
            record.getLastMode(),
            record.getLastCue() == null ? null : record.getLastCue().getId(),
            record.getLastPositionMs(),
            new ModesState(
                new ModeState(record.getListenProgress(), record.isListenConfirmed()),
                new ModeState(record.getReadProgress(), record.isReadConfirmed()),
                new ModeState(record.getWriteProgress(), record.isWriteConfirmed()),
                new ModeState(record.getSpeakProgress(), record.isSpeakConfirmed())),
            cues,
            record.getCompletedAt() != null);
    }

    private LearningRecord findOrCreateRecord(AuthenticatedUser user, Course course) {
        return recordRepository.findByUserIdAndCourseId(user.id(), course.getId())
            .orElseGet(() -> {
                LearningRecord record = new LearningRecord();
                record.setUser(userRepository.getReferenceById(user.id()));
                record.setCourse(course);
                return recordRepository.save(record);
            });
    }

    private LearningCueProgress newCueProgress(AuthenticatedUser user, Course course, SubtitleCue cue) {
        LearningCueProgress progress = new LearningCueProgress();
        progress.setUser(userRepository.getReferenceById(user.id()));
        progress.setCourse(course);
        progress.setCue(cue);
        return progress;
    }

    private StudySession newSession(AuthenticatedUser user, Course course, Instant now) {
        StudySession session = new StudySession();
        session.setId(UUID.randomUUID().toString());
        session.setUser(userRepository.getReferenceById(user.id()));
        session.setCourse(course);
        session.setStartedAt(now);
        session.setLastActiveAt(now);
        return session;
    }

    private LearningDailyStat newDailyStat(AuthenticatedUser user, Course course, LocalDate date) {
        LearningDailyStat stat = new LearningDailyStat();
        stat.setUser(userRepository.getReferenceById(user.id()));
        stat.setCourse(course);
        stat.setStatDate(date);
        return stat;
    }

    private void refreshProgress(LearningRecord record, Long userId, Course course) {
        long total = cueRepository.countByCourseId(course.getId());
        record.setListenProgress(percent(
            cueProgressRepository.countByUserIdAndCourseIdAndHeardTrue(userId, course.getId()), total));
        record.setReadProgress(percent(
            cueProgressRepository.countByUserIdAndCourseIdAndReadTrue(userId, course.getId()), total));
        record.setWriteProgress(percent(
            cueProgressRepository.countByUserIdAndCourseIdAndWrittenTrue(userId, course.getId()), total));
        record.setSpeakProgress(percent(
            cueProgressRepository.countByUserIdAndCourseIdAndSpokenTrue(userId, course.getId()), total));
    }

    private Course publishedCourse(Long courseId) {
        return courseRepository.findByIdAndStatus(courseId, CourseStatus.PUBLISHED)
            .orElseThrow(() -> new ApiException("COURSE_NOT_FOUND", HttpStatus.NOT_FOUND, "课程不存在或已下架"));
    }

    private int percent(long completed, long total) {
        return total == 0 ? 0 : (int) Math.min(100, completed * 100 / total);
    }

    private int progress(LearningRecord record, LearningMode mode) {
        return switch (mode) {
            case LISTEN -> record.getListenProgress();
            case READ -> record.getReadProgress();
            case WRITE -> record.getWriteProgress();
            case SPEAK -> record.getSpeakProgress();
        };
    }

    private void setConfirmed(LearningRecord record, LearningMode mode) {
        switch (mode) {
            case LISTEN -> record.setListenConfirmed(true);
            case READ -> record.setReadConfirmed(true);
            case WRITE -> record.setWriteConfirmed(true);
            case SPEAK -> record.setSpeakConfirmed(true);
        }
    }

    private boolean allModesComplete(LearningRecord record) {
        return record.getListenProgress() == 100 && record.getReadProgress() == 100
            && record.getWriteProgress() == 100 && record.getSpeakProgress() == 100
            && record.isListenConfirmed() && record.isReadConfirmed()
            && record.isWriteConfirmed() && record.isSpeakConfirmed();
    }

    private String normalize(String text) {
        return text.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9\\s]", "")
            .trim()
            .replaceAll("\\s+", " ");
    }
}
