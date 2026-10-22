package com.sayline.englishstudy.learning;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseFavoriteRepository extends JpaRepository<CourseFavorite, Long> {

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    long deleteByUserIdAndCourseId(Long userId, Long courseId);

    @Query("""
        select favorite.course.id from CourseFavorite favorite
        where favorite.user.id = :userId and favorite.course.id in :courseIds
        """)
    List<Long> findFavoriteCourseIds(
        @Param("userId") Long userId,
        @Param("courseIds") Collection<Long> courseIds);

    @EntityGraph(attributePaths = {"course", "course.category"})
    @Query("""
        select favorite from CourseFavorite favorite
        where favorite.user.id = :userId
          and favorite.course.status = com.sayline.englishstudy.catalog.CourseStatus.PUBLISHED
        """)
    Page<CourseFavorite> findPublishedFavorites(@Param("userId") Long userId, Pageable pageable);
}
