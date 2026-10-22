package com.sayline.englishstudy.learning;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudySessionRepository extends JpaRepository<StudySession, String> {

    Optional<StudySession> findFirstByUserIdAndCourseIdOrderByLastActiveAtDesc(Long userId, Long courseId);
}
