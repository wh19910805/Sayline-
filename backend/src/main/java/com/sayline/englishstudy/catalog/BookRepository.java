package com.sayline.englishstudy.catalog;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByVisibleTrueOrderBySortOrderAscIdAsc();

    List<Book> findByCategoryIdAndVisibleTrueOrderBySortOrderAscIdAsc(Long categoryId);

    @Query("""
        select b from Book b
        join b.category c
        where b.visible = true
          and (:categoryId is null or c.id = :categoryId)
          and (:query is null
            or lower(b.title) like lower(concat('%', :query, '%'))
            or lower(coalesce(b.description, '')) like lower(concat('%', :query, '%'))
            or lower(c.name) like lower(concat('%', :query, '%')))
        order by b.sortOrder asc, b.id asc
        """)
    List<Book> searchVisible(
        @Param("categoryId") Long categoryId,
        @Param("query") String query);

    boolean existsByCategoryId(Long categoryId);

    @Query("""
        select b from Book b
        join b.category c
        where (:categoryId is null or c.id = :categoryId)
          and (:visible is null or b.visible = :visible)
          and (:query is null
            or lower(b.title) like lower(concat('%', :query, '%'))
            or lower(coalesce(b.description, '')) like lower(concat('%', :query, '%'))
            or lower(c.name) like lower(concat('%', :query, '%')))
        """)
    Page<Book> searchAdmin(
        @Param("categoryId") Long categoryId,
        @Param("visible") Boolean visible,
        @Param("query") String query,
        Pageable pageable);

    List<Book> findByCoverObjectKeyIsNotNullAndCoverThumbnailObjectKeyIsNull();
}
