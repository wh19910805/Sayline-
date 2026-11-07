package com.sayline.englishstudy.catalog;

import java.time.Instant;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
public class Course extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "cover_object_key", length = 255)
    private String coverObjectKey;

    @Column(name = "audio_object_key", length = 255)
    private String audioObjectKey;

    @Column(name = "subtitle_object_key", length = 255)
    private String subtitleObjectKey;

    @Column(name = "duration_ms", nullable = false)
    private long durationMs;

    @Column(name = "theme_color_primary", length = 20)
    private String themeColorPrimary;

    @Column(name = "theme_color_secondary", length = 20)
    private String themeColorSecondary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseStatus status = CourseStatus.DRAFT;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "published_at")
    private Instant publishedAt;
}
