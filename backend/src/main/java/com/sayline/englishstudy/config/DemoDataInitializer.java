package com.sayline.englishstudy.config;

import java.util.List;

import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
public class DemoDataInitializer implements ApplicationRunner {

    private final CourseCategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final SubtitleCueRepository cueRepository;
    private final boolean enabled;

    public DemoDataInitializer(
        CourseCategoryRepository categoryRepository,
        CourseRepository courseRepository,
        SubtitleCueRepository cueRepository,
        @Value("${app.seed-demo}") boolean enabled
    ) {
        this.categoryRepository = categoryRepository;
        this.courseRepository = courseRepository;
        this.cueRepository = cueRepository;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || courseRepository.count() > 0) {
            return;
        }

        CourseCategory work = category("职场英语", "会议、协作与真实职场表达", "/covers/work.jpg", "#65734f", "#9f5e31", 1);
        CourseCategory spoken = category("日常口语", "闲聊、社交与自然开口", "/covers/spoken.jpg", "#8b6651", "#42271f", 2);
        CourseCategory listening = category("听力训练", "抓住重点，适应真实语速", "/covers/listening.jpg", "#517671", "#243a38", 3);

        course(work, "Meeting a New Colleague", "Meeting someone new at work", "#65734f", "#9f5e31", 1, List.of(
            new CueData(0, 3_000, "Nice to meet you. I'm Alex from the design team.", "很高兴认识你，我是设计团队的 Alex。"),
            new CueData(3_000, 7_000, "Nice to meet you too. I just joined this week.", "我也很高兴认识你，我这周刚入职。"),
            new CueData(7_000, 11_000, "Could we move the meeting to Friday morning?", "我们能把会议改到周五上午吗？"),
            new CueData(11_000, 15_000, "Friday works for me. How about ten thirty?", "周五我可以。十点半怎么样？"),
            new CueData(15_000, 19_000, "That's perfect. I'll send a calendar invite.", "太好了，我会发一个日历邀请。")));

        course(work, "Email Follow-up", "Write a calm, clear follow-up", "#94633c", "#3e2a1c", 2, List.of(
            new CueData(0, 3_500, "Just following up on my previous email.", "想跟进一下我之前的邮件。"),
            new CueData(3_500, 7_000, "Let me know if you need anything else.", "如果需要其他信息，请告诉我。"),
            new CueData(7_000, 11_000, "I'd appreciate a reply by Thursday.", "如果能在周四前回复，我会很感激。"),
            new CueData(11_000, 15_000, "I've attached the latest version for review.", "我附上了最新版本供审阅。"),
            new CueData(15_000, 19_000, "Thanks for keeping me updated.", "谢谢你及时告知我。")));

        course(spoken, "Coffee Chat Basics", "Small talk that sounds natural", "#436b83", "#1b3346", 1, List.of(
            new CueData(0, 3_000, "Is this seat taken?", "这个座位有人吗？"),
            new CueData(3_000, 6_500, "No, go ahead. I'm waiting for a friend.", "没有，请坐。我在等朋友。"),
            new CueData(6_500, 10_000, "The coffee here is surprisingly good.", "这里的咖啡出乎意料地好喝。"),
            new CueData(10_000, 14_000, "What do you usually order?", "你通常点什么？"),
            new CueData(14_000, 18_000, "An oat latte, unless it's too late in the day.", "燕麦拿铁，除非时间太晚了。")));

        course(spoken, "Small Talk at Lunch", "Keep a lunch conversation moving", "#8b6651", "#42271f", 2, List.of(
            new CueData(0, 3_000, "Have you tried the new place downstairs?", "你试过楼下新开的店吗？"),
            new CueData(3_000, 6_000, "Not yet. Is it any good?", "还没有。好吃吗？"),
            new CueData(6_000, 10_000, "Their noodles are worth the wait.", "他们的面值得等。"),
            new CueData(10_000, 14_000, "Do you want to join us?", "你想加入我们吗？"),
            new CueData(14_000, 18_000, "I have a meeting in ten minutes.", "我十分钟后有个会。")));

        course(listening, "Get the Main Point", "Train your ear to hear the core idea", "#517671", "#243a38", 1, List.of(
            new CueData(0, 3_500, "The key issue is not speed but clarity.", "关键问题不是速度，而是清晰度。"),
            new CueData(3_500, 7_000, "People remember stories better than facts.", "人们往往更容易记住故事，而不是事实。"),
            new CueData(7_000, 11_000, "So let's lead with one concrete example.", "所以我们先用一个具体的例子开场。"),
            new CueData(11_000, 15_000, "Start with the conclusion, then explain why.", "先讲结论，再解释原因。"),
            new CueData(15_000, 19_000, "That is the sentence I want people to remember.", "这就是我想让大家记住的那句话。")));
    }

    private CourseCategory category(
        String name,
        String description,
        String cover,
        String primary,
        String secondary,
        int order
    ) {
        CourseCategory category = new CourseCategory();
        category.setName(name);
        category.setDescription(description);
        category.setCoverObjectKey(cover);
        category.setThemeColorPrimary(primary);
        category.setThemeColorSecondary(secondary);
        category.setSortOrder(order);
        category.setVisible(true);
        return categoryRepository.save(category);
    }

    private void course(
        CourseCategory category,
        String title,
        String description,
        String primary,
        String secondary,
        int order,
        List<CueData> cues
    ) {
        Course course = new Course();
        course.setCategory(category);
        course.setTitle(title);
        course.setDescription(description);
        course.setCoverObjectKey(category.getCoverObjectKey());
        course.setAudioObjectKey("/audio/demo.wav");
        course.setSubtitleObjectKey("/demo/subtitles.srt");
        course.setThemeColorPrimary(primary);
        course.setThemeColorSecondary(secondary);
        course.setDurationMs(20_000);
        course.setSortOrder(order);
        course.setStatus(CourseStatus.PUBLISHED);
        course = courseRepository.save(course);

        int sequence = 1;
        for (CueData item : cues) {
            SubtitleCue cue = new SubtitleCue();
            cue.setCourse(course);
            cue.setSequenceNo(sequence++);
            cue.setStartMs(item.startMs());
            cue.setEndMs(item.endMs());
            cue.setEnglishText(item.english());
            cue.setChineseText(item.chinese());
            cueRepository.save(cue);
        }
    }

    private record CueData(long startMs, long endMs, String english, String chinese) {
    }
}
