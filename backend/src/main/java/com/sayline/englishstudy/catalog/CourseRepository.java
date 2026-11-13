package com.sayline.englishstudy.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByIdAndStatus(Long id, CourseStatus status);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByBookId(Long bookId);

    long countByStatus(CourseStatus status);

    List<Course> findByBookIdAndStatusOrderBySortOrderAscIdAsc(Long bookId, CourseStatus status);

    long countByBookIdAndStatus(Long bookId, CourseStatus status);

    @Query("""
        select c from Course c
        join fetch c.book
        join fetch c.category
        order by c.id asc
        """)
    List<Course> findAllForImport();

    List<Course> findByBookIdInAndStatusOrderBySortOrderAscIdAsc(List<Long> bookIds, CourseStatus status);

    @Query("""
        select c from Course c
        join c.book book
        where (:bookId is null or book.id = :bookId)
          and (:status is null or c.status = :status)
          and (:query is null
            or lower(c.title) like lower(concat('%', :query, '%'))
            or lower(book.title) like lower(concat('%', :query, '%')))
        """)
    Page<Course> searchAdmin(
        @Param("bookId") Long bookId,
        @Param("status") CourseStatus status,
        @Param("query") String query,
        Pageable pageable);

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
