package com.sayline.englishstudy.catalog;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class CourseSchemaTest {

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SubtitleCueRepository cueRepository;

    @Test
    void savesCourseWithSubtitleCuesAndReadsThemInSequence() {
        CourseCategory category = new CourseCategory();
        category.setName("Daily Listening");
        category.setSortOrder(1);
        category.setVisible(true);
        category = categoryRepository.save(category);

        Course course = new Course();
        course.setCategory(category);
        course.setTitle("Coffee Shop Small Talk");
        course.setDescription("Order naturally and keep the conversation going.");
        course.setStatus(CourseStatus.DRAFT);
        course.setSortOrder(1);
        course = courseRepository.save(course);

        SubtitleCue second = new SubtitleCue();
        second.setCourse(course);
        second.setSequenceNo(2);
        second.setStartMs(3_000);
        second.setEndMs(5_500);
        second.setEnglishText("Could I get a flat white, please?");
        second.setChineseText("请给我一杯馥芮白，好吗？");
        cueRepository.save(second);

        SubtitleCue first = new SubtitleCue();
        first.setCourse(course);
        first.setSequenceNo(1);
        first.setStartMs(0);
        first.setEndMs(2_800);
        first.setEnglishText("Good morning! What can I get for you?");
        first.setChineseText("早上好！您想喝点什么？");
        cueRepository.save(first);

        List<SubtitleCue> cues = cueRepository.findByCourseIdOrderBySequenceNoAsc(course.getId());

        assertThat(cues).extracting(SubtitleCue::getSequenceNo).containsExactly(1, 2);
        assertThat(cues.getFirst().getEnglishText()).startsWith("Good morning");
    }
}
