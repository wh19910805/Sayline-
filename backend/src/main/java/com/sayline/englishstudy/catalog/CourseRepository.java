package com.sayline.englishstudy.catalog;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByIdAndStatus(Long id, CourseStatus status);

    @Query("""
        select c from Course c
        join c.category category
        where c.status = :status
          and (:categoryId is null or category.id = :categoryId)
          and (:query is null
            or lower(c.title) like lower(concat('%', :query, '%'))
            or lower(category.name) like lower(concat('%', :query, '%')))
        """)
    Page<Course> searchPublished(
        @Param("categoryId") Long categoryId,
        @Param("query") String query,
        @Param("status") CourseStatus status,
        Pageable pageable);
}
