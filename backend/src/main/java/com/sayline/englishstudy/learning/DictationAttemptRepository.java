package com.sayline.englishstudy.learning;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DictationAttemptRepository extends JpaRepository<DictationAttempt, Long> {

    long countByUserId(Long userId);

    long countByUserIdAndCorrectTrue(Long userId);

    long countByCorrectTrue();
}
