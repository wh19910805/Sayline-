package com.sayline.englishstudy.learning;

import java.time.Instant;

import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.common.AuditableEntity;
import com.sayline.englishstudy.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "learning_records",
    uniqueConstraints = @UniqueConstraint(name = "uk_learning_record", columnNames = {"user_id", "course_id"}))
@Getter
@Setter
@NoArgsConstructor
public class LearningRecord extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_mode", nullable = false, length = 20)
    private LearningMode lastMode = LearningMode.LISTEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_cue_id")
    private SubtitleCue lastCue;

    @Column(name = "last_position_ms", nullable = false)
    private long lastPositionMs;

    @Column(name = "listen_progress", nullable = false)
    private int listenProgress;

    @Column(name = "read_progress", nullable = false)
    private int readProgress;

    @Column(name = "write_progress", nullable = false)
    private int writeProgress;

    @Column(name = "speak_progress", nullable = false)
    private int speakProgress;

    @Column(name = "listen_confirmed", nullable = false)
    private boolean listenConfirmed;

    @Column(name = "read_confirmed", nullable = false)
    private boolean readConfirmed;

    @Column(name = "write_confirmed", nullable = false)
    private boolean writeConfirmed;

    @Column(name = "speak_confirmed", nullable = false)
    private boolean speakConfirmed;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "total_study_ms", nullable = false)
    private long totalStudyMs;

    @Column(name = "last_studied_at")
    private Instant lastStudiedAt;
}
