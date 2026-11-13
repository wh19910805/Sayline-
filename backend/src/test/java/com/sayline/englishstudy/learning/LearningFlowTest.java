package com.sayline.englishstudy.learning;

import java.time.LocalDate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sayline.englishstudy.catalog.Book;
import com.sayline.englishstudy.catalog.BookRepository;
import com.sayline.englishstudy.catalog.Course;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.catalog.CourseStatus;
import com.sayline.englishstudy.catalog.SubtitleCue;
import com.sayline.englishstudy.catalog.SubtitleCueRepository;
import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserRepository;
import com.sayline.englishstudy.user.UserRole;
import com.sayline.englishstudy.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LearningFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SubtitleCueRepository cueRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String token;
    private Course course;
    private SubtitleCue firstCue;
    private SubtitleCue secondCue;

    @BeforeEach
    void setUp() throws Exception {
        for (String table : new String[] {
            "admin_audit_logs", "content_import_jobs", "password_reset_tokens",
            "review_cue_states", "learning_cue_progress", "dictation_attempts", "learning_daily_stats",
            "study_sessions", "learning_records", "course_favorites", "refresh_sessions",
            "subtitle_cues", "courses", "book_favorites", "books", "user_settings",
            "user_interests", "course_categories", "users"
        }) {
            jdbcTemplate.update("delete from " + table);
        }

        User user = new User();
        user.setPhone("13800138200");
        user.setNickname("Learner");
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ENABLED);
        userRepository.save(user);
        token = login(user.getPhone());

        CourseCategory category = new CourseCategory();
        category.setName("Listening");
        category.setSortOrder(1);
        categoryRepository.save(category);

        Book book = new Book();
        book.setCategory(category);
        book.setTitle("Listening");
        book.setSortOrder(1);
        book.setVisible(true);
        bookRepository.save(book);

        course = new Course();
        course.setBook(book);
        course.setCategory(category);
        course.setTitle("Mini Dialogue");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setDurationMs(10_000);
        courseRepository.save(course);

        firstCue = createCue(1, "Hello there.", "你好。");
        secondCue = createCue(2, "How are you?", "你好吗？");
    }

    @Test
    void deduplicatesCueActionsAndCompletesCourseOnlyAfterAllModesAreConfirmed() throws Exception {
        action(firstCue, "LISTEN", 1_500, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.modes.listen.progress").value(50));
        action(firstCue, "LISTEN", 1_500, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.modes.listen.progress").value(50));
        action(secondCue, "LISTEN", 1_500, null)
            .andExpect(jsonPath("$.modes.listen.progress").value(100));

        action(firstCue, "READ", 1_000, null);
        action(secondCue, "READ", 1_000, null);
        action(firstCue, "WRITE", 0, "hello there");
            action(secondCue, "WRITE", 0, "wrong answer")
            .andExpect(jsonPath("$.modes.write.progress").value(100));
        action(firstCue, "SPEAK", 1_000, null);
        action(secondCue, "SPEAK", 1_000, null);

        confirm("LISTEN").andExpect(jsonPath("$.completed").value(false));
        confirm("READ").andExpect(jsonPath("$.completed").value(false));
        confirm("WRITE").andExpect(jsonPath("$.completed").value(false));
        confirm("SPEAK").andExpect(jsonPath("$.completed").value(true));

        mockMvc.perform(get("/api/v1/learning/stats")
                .param("period", "WEEK")
                .param("date", LocalDate.now().toString())
                .header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary.dictationAccuracy").value(50));
    }

    @Test
    void returnsLatestIncorrectDictationCuesAsReviewQueue() throws Exception {
        action(secondCue, "WRITE", 0, "wrong answer")
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learning/reviews")
                .header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].courseId").value(course.getId()))
            .andExpect(jsonPath("$[0].cueId").value(secondCue.getId()))
            .andExpect(jsonPath("$[0].englishText").value("How are you?"));
    }

    @Test
    void completesListeningFromPlaybackWhenAudioReachesEnd() throws Exception {
        mockMvc.perform(post("/api/v1/learning/courses/{courseId}/confirm", course.getId())
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"mode":"LISTEN","playbackCompleted":true}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.modes.listen.progress").value(100))
            .andExpect(jsonPath("$.modes.listen.confirmed").value(true))
            .andExpect(jsonPath("$.cues[0].heard").value(true))
            .andExpect(jsonPath("$.cues[1].heard").value(true));
    }

    @Test
    void marksReviewCuesMasteredAndSnoozedUntilDue() throws Exception {
        action(secondCue, "WRITE", 0, "wrong answer").andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/learning/reviews/{cueId}", secondCue.getId())
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"MASTERED"}
                    """))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/learning/reviews").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/v1/learning/reviews")
                .param("includeMastered", "true")
                .header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("MASTERED"));

        mockMvc.perform(patch("/api/v1/learning/reviews/{cueId}", secondCue.getId())
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"SNOOZED","nextReviewAt":"2020-01-01T00:00:00Z"}
                    """))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/learning/reviews").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("SNOOZED"))
            .andExpect(jsonPath("$[0].due").value(true));
    }

    @Test
    void countsOneSessionAtThirtySecondsAndStartsNewSessionAfterTenMinutes() throws Exception {
        heartbeat(10_000).andExpect(jsonPath("$.sessionCounted").value(false));
        heartbeat(10_000).andExpect(jsonPath("$.sessionCounted").value(false));
        heartbeat(10_000).andExpect(jsonPath("$.sessionCounted").value(true));

        jdbcTemplate.update("update study_sessions set last_active_at = dateadd('MINUTE', -11, current_timestamp)");
        heartbeat(10_000).andExpect(jsonPath("$.sessionCounted").value(false));
        heartbeat(20_000).andExpect(jsonPath("$.sessionCounted").value(true));

        mockMvc.perform(get("/api/v1/learning/stats")
                .param("period", "WEEK")
                .param("date", LocalDate.now().toString())
                .header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary.sessions").value(2))
            .andExpect(jsonPath("$.summary.studyMs").value(60_000))
            .andExpect(jsonPath("$.summary.studyDays").value(1));
    }

    private org.springframework.test.web.servlet.ResultActions action(
        SubtitleCue cue,
        String mode,
        long durationMs,
        String answer
    ) throws Exception {
        String body = """
            {"cueId":%d,"mode":"%s","durationMs":%d,"answer":%s}
            """.formatted(
                cue.getId(),
                mode,
                durationMs,
                answer == null ? "null" : objectMapper.writeValueAsString(answer));
        return mockMvc.perform(post("/api/v1/learning/courses/{courseId}/actions", course.getId())
            .header("Authorization", bearer())
            .contentType(MediaType.APPLICATION_JSON)
            .content(body));
    }

    private org.springframework.test.web.servlet.ResultActions confirm(String mode) throws Exception {
        return mockMvc.perform(post("/api/v1/learning/courses/{courseId}/confirm", course.getId())
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"mode":"%s"}
                    """.formatted(mode)))
            .andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.ResultActions heartbeat(long activeMs) throws Exception {
        return mockMvc.perform(post("/api/v1/learning/courses/{courseId}/heartbeat", course.getId())
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"activeMs":%d}
                    """.formatted(activeMs)))
            .andExpect(status().isOk());
    }

    private SubtitleCue createCue(int sequence, String english, String chinese) {
        SubtitleCue cue = new SubtitleCue();
        cue.setCourse(course);
        cue.setSequenceNo(sequence);
        cue.setStartMs((sequence - 1) * 3_000L);
        cue.setEndMs(sequence * 3_000L);
        cue.setEnglishText(english);
        cue.setChineseText(chinese);
        return cueRepository.save(cue);
    }

    private String login(String phone) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"%s","password":"Sayline123"}
                    """.formatted(phone)))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }

    private String bearer() {
        return "Bearer " + token;
    }
}
