package com.sayline.englishstudy.user;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    @EntityGraph(attributePaths = "category")
    List<UserInterest> findByUserIdOrderBySortOrderAsc(Long userId);

    @Modifying
    @Query("delete from UserInterest ui where ui.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
