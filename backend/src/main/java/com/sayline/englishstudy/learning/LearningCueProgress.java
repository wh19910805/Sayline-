package com.sayline.englishstudy.learning;

import java.time.Instant;

import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "learning_cue_progress",
    uniqueConstraints = @UniqueConstraint(name = "uk_user_cue_progress", columnNames = {"user_id", "cue_id"}))
@Getter
@Setter
@NoArgsConstructor
public class LearningCueProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cue_id", nullable = false)
    private SubtitleCue cue;

    @Column(nullable = false)
    private boolean heard;

    @Column(nullable = false)
    private boolean read;

    @Column(nullable = false)
    private boolean written;

    @Column(nullable = false)
    private boolean spoken;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
