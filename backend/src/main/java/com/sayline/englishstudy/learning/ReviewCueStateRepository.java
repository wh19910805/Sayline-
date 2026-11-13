package com.sayline.englishstudy.learning;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewCueStateRepository extends JpaRepository<ReviewCueState, Long> {

    Optional<ReviewCueState> findByUserIdAndCueId(Long userId, Long cueId);

    List<ReviewCueState> findByUserIdAndCueIdIn(Long userId, List<Long> cueIds);

    void deleteByUserId(Long userId);

    void deleteByCueCourseId(Long courseId);
}
