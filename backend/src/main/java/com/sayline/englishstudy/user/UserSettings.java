package com.sayline.englishstudy.user;

import java.math.BigDecimal;

import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
public class UserSettings extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "font_scale", nullable = false, precision = 3, scale = 2)
    private BigDecimal fontScale = BigDecimal.ONE;

    @Column(name = "subtitle_color", nullable = false, length = 20)
    private String subtitleColor = "#F8F2E8";

    @Column(name = "show_chinese_listen", nullable = false)
    private boolean showChineseListen = true;

    @Column(name = "show_chinese_read", nullable = false)
    private boolean showChineseRead = true;

    @Column(name = "show_chinese_write", nullable = false)
    private boolean showChineseWrite = true;

    @Column(name = "show_chinese_speak", nullable = false)
    private boolean showChineseSpeak = true;

    @Column(name = "playback_rate", nullable = false, precision = 3, scale = 2)
    private BigDecimal playbackRate = BigDecimal.ONE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_category_id")
    private CourseCategory defaultCategory;
}
