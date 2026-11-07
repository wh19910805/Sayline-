package com.sayline.englishstudy.catalog;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByVisibleTrueOrderBySortOrderAscIdAsc();

    List<Book> findByCategoryIdAndVisibleTrueOrderBySortOrderAscIdAsc(Long categoryId);

    boolean existsByCategoryId(Long categoryId);

    Page<Book> findByCategoryId(Long categoryId, Pageable pageable);

    List<Book> findByCoverObjectKeyIsNotNullAndCoverThumbnailObjectKeyIsNull();
}
