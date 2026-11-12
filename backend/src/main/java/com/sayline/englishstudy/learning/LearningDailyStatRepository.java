package com.sayline.englishstudy.learning;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningDailyStatRepository extends JpaRepository<LearningDailyStat, Long> {

    Optional<LearningDailyStat> findByUserIdAndCourseIdAndStatDate(Long userId, Long courseId, LocalDate statDate);

    List<LearningDailyStat> findByUserIdAndStatDateBetween(Long userId, LocalDate start, LocalDate end);

    @Query("select coalesce(sum(stat.studyMs), 0) from LearningDailyStat stat")
    long totalStudyMs();

    @Query("""
        select stat.statDate, sum(stat.studyMs), count(distinct stat.user.id)
        from LearningDailyStat stat
        where stat.statDate between :start and :end
        group by stat.statDate
        order by stat.statDate
        """)
    List<Object[]> dailyTrend(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
