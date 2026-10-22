package com.sayline.englishstudy.learning;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningRecordRepository extends JpaRepository<LearningRecord, Long> {

    Optional<LearningRecord> findByUserIdAndCourseId(Long userId, Long courseId);
}
