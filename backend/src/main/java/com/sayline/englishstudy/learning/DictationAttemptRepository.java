package com.sayline.englishstudy.learning;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DictationAttemptRepository extends JpaRepository<DictationAttempt, Long> {

    long countByUserId(Long userId);

    long countByUserIdAndCorrectTrue(Long userId);

    long countByCorrectTrue();

    List<DictationAttempt> findTop50ByUserIdAndCorrectFalseOrderByCreatedAtDesc(Long userId);

    void deleteByCourseId(Long courseId);

    void deleteByUserId(Long userId);
}
