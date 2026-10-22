package com.sayline.englishstudy.learning;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningCueProgressRepository extends JpaRepository<LearningCueProgress, Long> {

    Optional<LearningCueProgress> findByUserIdAndCueId(Long userId, Long cueId);

    List<LearningCueProgress> findByUserIdAndCourseId(Long userId, Long courseId);

    long countByUserIdAndCourseIdAndHeardTrue(Long userId, Long courseId);

    long countByUserIdAndCourseIdAndReadTrue(Long userId, Long courseId);

    long countByUserIdAndCourseIdAndWrittenTrue(Long userId, Long courseId);

    long countByUserIdAndCourseIdAndSpokenTrue(Long userId, Long courseId);

    long countByUserIdAndSpokenTrue(Long userId);
}
