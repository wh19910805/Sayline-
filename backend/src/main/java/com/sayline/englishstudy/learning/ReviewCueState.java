package com.sayline.englishstudy.learning;

import java.time.Instant;

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
    name = "review_cue_states",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_review_cue_state",
        columnNames = {"user_id", "cue_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ReviewCueState extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cue_id", nullable = false)
    private SubtitleCue cue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewStatus status;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;
}
