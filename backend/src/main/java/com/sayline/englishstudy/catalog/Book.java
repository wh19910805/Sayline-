package com.sayline.englishstudy.catalog;

import com.sayline.englishstudy.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
public class Book extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CourseCategory category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "cover_object_key", length = 255)
    private String coverObjectKey;

    @Column(name = "cover_thumbnail_object_key", length = 255)
    private String coverThumbnailObjectKey;

    @Column(name = "spine_color", length = 7)
    private String spineColor;

    @Column(name = "theme_color_primary", length = 20)
    private String themeColorPrimary;

    @Column(name = "theme_color_secondary", length = 20)
    private String themeColorSecondary;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean visible = true;
}
