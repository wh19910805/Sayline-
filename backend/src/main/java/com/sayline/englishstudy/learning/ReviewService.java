package com.sayline.englishstudy.learning;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.learning.ReviewDtos.ReviewCue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final DictationAttemptRepository dictationRepository;

    public ReviewService(DictationAttemptRepository dictationRepository) {
        this.dictationRepository = dictationRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewCue> reviews(Long userId) {
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
        return latestByCue.values().stream()
            .map(attempt -> {
                var cue = attempt.getCue();
                var course = attempt.getCourse();
                var book = course.getBook();
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
                    attempt.getCreatedAt());
            })
            .toList();
    }
}
