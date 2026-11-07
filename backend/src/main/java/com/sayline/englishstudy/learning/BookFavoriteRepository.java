package com.sayline.englishstudy.learning;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookFavoriteRepository extends JpaRepository<BookFavorite, Long> {

    boolean existsByUserIdAndBookId(Long userId, Long bookId);

    long deleteByUserIdAndBookId(Long userId, Long bookId);

    @Query("""
        select favorite.book.id from BookFavorite favorite
        where favorite.user.id = :userId and favorite.book.id in :bookIds
        """)
    List<Long> findFavoriteBookIds(
        @Param("userId") Long userId,
        @Param("bookIds") Collection<Long> bookIds);

    @Query("""
        select favorite.book.id from BookFavorite favorite
        where favorite.user.id = :userId
        """)
    List<Long> findFavoriteBookIds(@Param("userId") Long userId);
}
