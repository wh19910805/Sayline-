package com.sayline.englishstudy.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubtitleCueRepository extends JpaRepository<SubtitleCue, Long> {

    List<SubtitleCue> findByCourseIdOrderBySequenceNoAsc(Long courseId);

    long countByCourseId(Long courseId);

    @Query("""
        select cue.course.id, count(cue)
        from SubtitleCue cue
        where cue.course.id in :courseIds
        group by cue.course.id
        """)
    List<Object[]> countByCourseIds(@Param("courseIds") List<Long> courseIds);

    void deleteByCourseId(Long courseId);

    @Query("""
        select cue from SubtitleCue cue
        join cue.course course
        where course.status = com.sayline.englishstudy.catalog.CourseStatus.PUBLISHED
          and (lower(cue.englishText) like lower(concat('%', :query, '%'))
            or lower(cue.chineseText) like lower(concat('%', :query, '%'))
            or lower(course.title) like lower(concat('%', :query, '%')))
        order by course.sortOrder asc, course.id asc, cue.sequenceNo asc
        """)
    List<SubtitleCue> searchPublished(@Param("query") String query);
}
