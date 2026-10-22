package com.sayline.englishstudy.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    name = "subtitle_cues",
    uniqueConstraints = @UniqueConstraint(name = "uk_course_cue_sequence", columnNames = {"course_id", "sequence_no"}))
@Getter
@Setter
@NoArgsConstructor
public class SubtitleCue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;

    @Column(name = "start_ms", nullable = false)
    private long startMs;

    @Column(name = "end_ms", nullable = false)
    private long endMs;

    @Column(name = "english_text", nullable = false, length = 2000)
    private String englishText;

    @Column(name = "chinese_text", nullable = false, length = 2000)
    private String chineseText;
}
