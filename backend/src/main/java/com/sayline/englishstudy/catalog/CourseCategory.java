package com.sayline.englishstudy.catalog;

import com.sayline.englishstudy.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "course_categories")
@Getter
@Setter
@NoArgsConstructor
public class CourseCategory extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(length = 300)
    private String description;

    @Column(name = "cover_object_key", length = 255)
    private String coverObjectKey;

    @Column(name = "theme_color_primary", length = 20)
    private String themeColorPrimary;

    @Column(name = "theme_color_secondary", length = 20)
    private String themeColorSecondary;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean visible = true;
}
