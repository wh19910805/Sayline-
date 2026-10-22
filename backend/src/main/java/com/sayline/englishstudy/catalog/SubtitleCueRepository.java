package com.sayline.englishstudy.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubtitleCueRepository extends JpaRepository<SubtitleCue, Long> {

    List<SubtitleCue> findByCourseIdOrderBySequenceNoAsc(Long courseId);

    long countByCourseId(Long courseId);
}
