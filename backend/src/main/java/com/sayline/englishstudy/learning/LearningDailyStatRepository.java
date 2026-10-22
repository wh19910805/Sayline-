package com.sayline.englishstudy.learning;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LearningDailyStatRepository extends JpaRepository<LearningDailyStat, Long> {

    Optional<LearningDailyStat> findByUserIdAndCourseIdAndStatDate(Long userId, Long courseId, LocalDate statDate);

    List<LearningDailyStat> findByUserIdAndStatDateBetween(Long userId, LocalDate start, LocalDate end);

    @Query("select coalesce(sum(stat.studyMs), 0) from LearningDailyStat stat")
    long totalStudyMs();
}
