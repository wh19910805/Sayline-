package com.sayline.englishstudy.catalog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogApiTest {

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
    private CourseRepository courseRepository;

    @Autowired
    private SubtitleCueRepository cueRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        for (String table : new String[] {
            "learning_cue_progress", "dictation_attempts", "learning_daily_stats",
            "study_sessions", "learning_records", "course_favorites", "refresh_sessions",
            "subtitle_cues", "courses", "user_settings", "user_interests",
            "course_categories", "users"
        }) {
            jdbcTemplate.update("delete from " + table);
        }
    }

    @Test
    void listsOnlyVisibleCategoriesInConfiguredOrder() throws Exception {
        createCategory("Hidden", 0, false);
        createCategory("Work", 2, true);
        createCategory("Listening", 1, true);
        String token = createLearnerToken("13800138100");

        mockMvc.perform(get("/api/v1/categories").header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Listening"))
            .andExpect(jsonPath("$[1].name").value("Work"))
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void searchesPublishedCoursesWithinCategory() throws Exception {
        CourseCategory work = createCategory("Work", 1, true);
        CourseCategory listening = createCategory("Listening", 2, true);
        createCourse(work, "Coffee Shop Small Talk", CourseStatus.PUBLISHED);
        createCourse(work, "Draft Interview", CourseStatus.DRAFT);
        createCourse(listening, "Coffee Without Context", CourseStatus.PUBLISHED);
        String token = createLearnerToken("13800138101");

        mockMvc.perform(get("/api/v1/courses")
                .param("categoryId", work.getId().toString())
                .param("q", "coffee")
                .header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Coffee Shop Small Talk"))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void returnsPublishedCourseDetailWithOrderedCues() throws Exception {
        CourseCategory category = createCategory("Work", 1, true);
        Course course = createCourse(category, "Meeting Openers", CourseStatus.PUBLISHED);
        createCue(course, 2, "Shall we get started?", "我们开始吧？");
        createCue(course, 1, "Good morning, everyone.", "大家早上好。");
        String token = createLearnerToken("13800138102");

        mockMvc.perform(get("/api/v1/courses/{id}", course.getId())
                .header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Meeting Openers"))
            .andExpect(jsonPath("$.cues[0].sequenceNo").value(1))
            .andExpect(jsonPath("$.cues[1].englishText").value("Shall we get started?"));
    }

    @Test
    void favoriteToggleIsIdempotentAndFavoriteListUsesLatestFirst() throws Exception {
        CourseCategory category = createCategory("Work", 1, true);
        Course first = createCourse(category, "First Course", CourseStatus.PUBLISHED);
        Course second = createCourse(category, "Second Course", CourseStatus.PUBLISHED);
        String token = createLearnerToken("13800138103");

        addFavorite(first, token);
        addFavorite(first, token);
        Thread.sleep(10);
        addFavorite(second, token);

        mockMvc.perform(get("/api/v1/favorites").header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(2))
            .andExpect(jsonPath("$.content[0].title").value("Second Course"))
            .andExpect(jsonPath("$.content[1].title").value("First Course"));

        mockMvc.perform(delete("/api/v1/courses/{id}/favorite", first.getId())
                .header("Authorization", bearer(token)))
            .andExpect(status().isNoContent());
    }

    private void addFavorite(Course course, String token) throws Exception {
        mockMvc.perform(post("/api/v1/courses/{id}/favorite", course.getId())
                .header("Authorization", bearer(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.favorited").value(true));
    }

    private String createLearnerToken(String phone) throws Exception {
        User user = new User();
        user.setPhone(phone);
        user.setNickname("Learner");
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ENABLED);
        userRepository.save(user);

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"%s","password":"Sayline123"}
                    """.formatted(phone)))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = objectMapper.readTree(login.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }

    private CourseCategory createCategory(String name, int sortOrder, boolean visible) {
        CourseCategory category = new CourseCategory();
        category.setName(name);
        category.setSortOrder(sortOrder);
        category.setVisible(visible);
        category.setCoverObjectKey("category/" + name + ".jpg");
        category.setThemeColorPrimary("#2D5C4D");
        category.setThemeColorSecondary("#E8C99B");
        return categoryRepository.save(category);
    }

    private Course createCourse(CourseCategory category, String title, CourseStatus status) {
        Course course = new Course();
        course.setCategory(category);
        course.setTitle(title);
        course.setDescription(title + " description");
        course.setStatus(status);
        course.setCoverObjectKey("covers/" + title + ".jpg");
        course.setAudioObjectKey("audio/" + title + ".mp3");
        course.setSubtitleObjectKey("subtitle/" + title + ".srt");
        course.setThemeColorPrimary("#2D5C4D");
        course.setThemeColorSecondary("#E8C99B");
        return courseRepository.save(course);
    }

    private void createCue(Course course, int sequence, String english, String chinese) {
        SubtitleCue cue = new SubtitleCue();
        cue.setCourse(course);
        cue.setSequenceNo(sequence);
        cue.setStartMs((sequence - 1) * 3_000L);
        cue.setEndMs(sequence * 3_000L);
        cue.setEnglishText(english);
        cue.setChineseText(chinese);
        cueRepository.save(cue);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
