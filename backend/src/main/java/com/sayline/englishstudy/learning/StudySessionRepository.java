package com.sayline.englishstudy.learning;

import java.util.Optional;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudySessionRepository extends JpaRepository<StudySession, String> {

    Optional<StudySession> findFirstByUserIdAndCourseIdOrderByLastActiveAtDesc(Long userId, Long courseId);

    @Query("""
        select count(distinct session.user.id) from StudySession session
        where session.lastActiveAt >= :since
        """)
    long countActiveUsersSince(@Param("since") Instant since);
}
