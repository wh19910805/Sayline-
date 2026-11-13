package com.sayline.englishstudy.learning;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.learning.ReviewDtos.ReviewCue;
import com.sayline.englishstudy.learning.ReviewDtos.ReviewStateRequest;
import com.sayline.englishstudy.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final DictationAttemptRepository dictationRepository;
    private final ReviewCueStateRepository stateRepository;
    private final SubtitleCueRepository cueRepository;
    private final UserRepository userRepository;

    public ReviewService(
        DictationAttemptRepository dictationRepository,
        ReviewCueStateRepository stateRepository,
        SubtitleCueRepository cueRepository,
        UserRepository userRepository
    ) {
        this.dictationRepository = dictationRepository;
        this.stateRepository = stateRepository;
        this.cueRepository = cueRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewCue> reviews(Long userId, boolean includeMastered) {
        Map<Long, DictationAttempt> latestByCue = new LinkedHashMap<>();
        Map<Long, Integer> wrongCounts = new LinkedHashMap<>();
        for (DictationAttempt attempt : dictationRepository
            .findTop50ByUserIdAndCorrectFalseOrderByCreatedAtDesc(userId)) {
            if (attempt.getCourse().getStatus() != CourseStatus.PUBLISHED) {
                continue;
            }
            Long cueId = attempt.getCue().getId();
            latestByCue.putIfAbsent(cueId, attempt);
            wrongCounts.merge(cueId, 1, Integer::sum);
        }
        List<Long> cueIds = List.copyOf(latestByCue.keySet());
        Map<Long, ReviewCueState> states = stateRepository.findByUserIdAndCueIdIn(userId, cueIds).stream()
            .collect(java.util.stream.Collectors.toMap(
                state -> state.getCue().getId(),
                state -> state));
        Instant now = Instant.now();
        return latestByCue.values().stream()
            .map(attempt -> {
                var cue = attempt.getCue();
                var course = attempt.getCourse();
                var book = course.getBook();
                ReviewCueState state = states.get(cue.getId());
                ReviewStatus status = state == null ? ReviewStatus.LEARNING : state.getStatus();
                Instant nextReviewAt = state == null ? null : state.getNextReviewAt();
                boolean due = status == ReviewStatus.LEARNING
                    || status == ReviewStatus.SNOOZED && (nextReviewAt == null || !nextReviewAt.isAfter(now));
                return new ReviewCue(
                    book.getId(),
                    course.getId(),
                    cue.getId(),
                    book.getTitle(),
                    course.getTitle(),
                    cue.getSequenceNo(),
                    cue.getEnglishText(),
                    cue.getChineseText(),
                    attempt.getAnswerText(),
                    wrongCounts.getOrDefault(cue.getId(), 1),
                    attempt.getCreatedAt(),
                    status,
                    nextReviewAt,
                    due);
            })
            .filter(review -> includeMastered || review.status() != ReviewStatus.MASTERED)
            .filter(review -> review.status() == ReviewStatus.MASTERED || review.due())
            .sorted(Comparator
                .comparing(ReviewCue::wrongCount).reversed()
                .thenComparing(ReviewCue::lastWrongAt, Comparator.reverseOrder()))
            .toList();
    }

    @Transactional
    public void updateState(Long userId, Long cueId, ReviewStateRequest request) {
        if (request.status() == ReviewStatus.LEARNING) {
            stateRepository.findByUserIdAndCueId(userId, cueId).ifPresent(stateRepository::delete);
            return;
        }
        if (request.status() == ReviewStatus.SNOOZED && request.nextReviewAt() == null) {
            throw new ApiException("REVIEW_DUE_REQUIRED", HttpStatus.UNPROCESSABLE_ENTITY, "请选择复习时间");
        }
        ReviewCueState state = stateRepository.findByUserIdAndCueId(userId, cueId).orElseGet(() -> {
            ReviewCueState created = new ReviewCueState();
            created.setUser(userRepository.getReferenceById(userId));
            created.setCue(cueRepository.findById(cueId)
                .orElseThrow(() -> new ApiException("CUE_NOT_FOUND", HttpStatus.NOT_FOUND, "字幕不存在")));
            return created;
        });
        state.setStatus(request.status());
        state.setNextReviewAt(request.status() == ReviewStatus.SNOOZED ? request.nextReviewAt() : null);
        stateRepository.save(state);
    }
}
