package com.sayline.englishstudy.user;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    @EntityGraph(attributePaths = "category")
    List<UserInterest> findByUserIdOrderBySortOrderAsc(Long userId);

    void deleteByUserId(Long userId);
}
