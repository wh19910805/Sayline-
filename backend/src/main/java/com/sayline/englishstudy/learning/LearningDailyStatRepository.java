package com.sayline.englishstudy.learning;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningDailyStatRepository extends JpaRepository<LearningDailyStat, Long> {

    Optional<LearningDailyStat> findByUserIdAndCourseIdAndStatDate(Long userId, Long courseId, LocalDate statDate);

    List<LearningDailyStat> findByUserIdAndStatDateBetween(Long userId, LocalDate start, LocalDate end);
}
