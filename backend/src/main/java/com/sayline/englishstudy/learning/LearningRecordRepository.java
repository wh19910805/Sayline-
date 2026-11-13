package com.sayline.englishstudy.learning;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningRecordRepository extends JpaRepository<LearningRecord, Long> {

    Optional<LearningRecord> findByUserIdAndCourseId(Long userId, Long courseId);

    List<LearningRecord> findByCourseId(Long courseId);

    long countByCompletedAtIsNotNull();

    @Query("""
        select record from LearningRecord record
        where record.user.id = :userId and record.course.id in :courseIds
        """)
    List<LearningRecord> findByUserIdAndCourseIds(
        @Param("userId") Long userId,
        @Param("courseIds") List<Long> courseIds);

    @Query("""
        select record.course.id from LearningRecord record
        where record.user.id = :userId and record.course.id in :courseIds
          and record.completedAt is not null
        """)
    List<Long> findCompletedCourseIds(
        @Param("userId") Long userId,
        @Param("courseIds") List<Long> courseIds);

    @Query("""
        select record from LearningRecord record
        join fetch record.course course
        join fetch course.book book
        join fetch book.category
        where record.user.id = :userId and record.lastStudiedAt is not null
        order by record.lastStudiedAt desc
        """)
    List<LearningRecord> findRecentByUserId(@Param("userId") Long userId);

    void deleteByCourseId(Long courseId);

    void deleteByUserId(Long userId);
}
