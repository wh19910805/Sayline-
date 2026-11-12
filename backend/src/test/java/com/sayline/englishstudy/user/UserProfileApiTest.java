package com.sayline.englishstudy.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileApiTest {

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
    private PasswordEncoder passwordEncoder;

    private String token;
    private CourseCategory listening;
    private CourseCategory work;

    @BeforeEach
    void setUp() throws Exception {
        for (String table : new String[] {
            "learning_cue_progress", "dictation_attempts", "learning_daily_stats",
            "study_sessions", "learning_records", "course_favorites", "refresh_sessions",
            "subtitle_cues", "courses", "book_favorites", "books", "user_settings",
            "user_interests", "course_categories", "users"
        }) {
            jdbcTemplate.update("delete from " + table);
        }

        listening = category("Listening", 1);
        work = category("Work", 2);
        User user = new User();
        user.setPhone("13800138300");
        user.setNickname("Lin");
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ENABLED);
        userRepository.save(user);
        token = login();
    }

    @Test
    void readsAndUpdatesProfile() throws Exception {
        mockMvc.perform(get("/api/v1/me/profile").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nickname").value("Lin"))
            .andExpect(jsonPath("$.phone").value("13800138300"));

        mockMvc.perform(patch("/api/v1/me/profile")
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nickname":"Morning Reader","avatarObjectKey":"avatars/lin.jpg"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nickname").value("Morning Reader"))
            .andExpect(jsonPath("$.avatarUrl").value(org.hamcrest.Matchers.startsWith("http")));
    }

    @Test
    void returnsDefaultsAndPersistsLearningSettings() throws Exception {
        mockMvc.perform(get("/api/v1/me/settings").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fontScale").value(1.0))
            .andExpect(jsonPath("$.showChineseListen").value(true))
            .andExpect(jsonPath("$.showChineseWrite").value(true))
            .andExpect(jsonPath("$.showChineseSpeak").value(true))
            .andExpect(jsonPath("$.dailyGoalMinutes").value(15));

        mockMvc.perform(patch("/api/v1/me/settings")
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fontScale":1.25,
                      "subtitleColor":"#F5D8A8",
                      "showChineseListen":false,
                      "showChineseRead":true,
                      "showChineseWrite":true,
                      "showChineseSpeak":false,
                      "dailyGoalMinutes":30,
                      "defaultCategoryId":%d
                    }
                    """.formatted(work.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fontScale").value(1.25))
            .andExpect(jsonPath("$.subtitleColor").value("#F5D8A8"))
            .andExpect(jsonPath("$.dailyGoalMinutes").value(30))
            .andExpect(jsonPath("$.defaultCategoryId").value(work.getId()));
    }

    @Test
    void addsInterestToExistingSelectionWithoutConflict() throws Exception {
        mockMvc.perform(put("/api/v1/me/interests")
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"categoryIds":[%d]}
                    """.formatted(listening.getId())))
            .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/me/interests")
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"categoryIds":[%d,%d]}
                    """.formatted(listening.getId(), work.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(listening.getId()))
            .andExpect(jsonPath("$[1].id").value(work.getId()));
    }

    @Test
    void savesOrderedInterestsAndUsesFirstAsDefaultTab() throws Exception {
        mockMvc.perform(put("/api/v1/me/interests")
                .header("Authorization", bearer())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"categoryIds":[%d,%d]}
                    """.formatted(work.getId(), listening.getId())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Work"))
            .andExpect(jsonPath("$[1].name").value("Listening"));

        mockMvc.perform(get("/api/v1/me/interests").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(work.getId()))
            .andExpect(jsonPath("$[1].id").value(listening.getId()));

        mockMvc.perform(get("/api/v1/me/settings").header("Authorization", bearer()))
            .andExpect(jsonPath("$.defaultCategoryId").value(work.getId()));
    }

    private CourseCategory category(String name, int sortOrder) {
        CourseCategory category = new CourseCategory();
        category.setName(name);
        category.setSortOrder(sortOrder);
        category.setVisible(true);
        return categoryRepository.save(category);
    }

    private String login() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138300","password":"Sayline123"}
                    """))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }

    private String bearer() {
        return "Bearer " + token;
    }
}
