package com.sayline.englishstudy.learning;

import java.time.Instant;
import java.time.LocalDate;

import com.sayline.englishstudy.catalog.Course;
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
    name = "learning_daily_stats",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_daily_stat",
        columnNames = {"user_id", "course_id", "stat_date"}))
@Getter
@Setter
@NoArgsConstructor
public class LearningDailyStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "session_count", nullable = false)
    private int sessionCount;

    @Column(name = "study_ms", nullable = false)
    private long studyMs;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
