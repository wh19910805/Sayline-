package com.sayline.englishstudy.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sayline.englishstudy.catalog.Book;
import com.sayline.englishstudy.catalog.BookRepository;
import com.sayline.englishstudy.catalog.CourseCategory;
import com.sayline.englishstudy.catalog.CourseCategoryRepository;
import com.sayline.englishstudy.catalog.CourseRepository;
import com.sayline.englishstudy.storage.StorageService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminApiTest {

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
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private StorageService storageService;

    @BeforeEach
    void setUp() {
        for (String table : new String[] {
            "learning_cue_progress", "dictation_attempts", "learning_daily_stats",
            "study_sessions", "learning_records", "course_favorites", "refresh_sessions",
            "subtitle_cues", "courses", "book_favorites", "books", "user_settings",
            "user_interests", "course_categories", "users"
        }) {
            jdbcTemplate.update("delete from " + table);
        }
        when(storageService.readText(eq("subtitles/lesson.srt"))).thenReturn("""
            1
            00:00:00,000 --> 00:00:02,000
            Good morning.
            早上好。
            """);
    }

    @Test
    void deniesAdminEndpointsToLearners() throws Exception {
        String learnerToken = createUserAndLogin("13800138500", UserRole.USER);

        mockMvc.perform(get("/api/v1/admin/dashboard").header("Authorization", bearer(learnerToken)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void createsCategoryAndRejectsDeletingCategoryWithBooks() throws Exception {
        String adminToken = createUserAndLogin("13800138501", UserRole.ADMIN);

        MvcResult created = mockMvc.perform(post("/api/v1/admin/categories")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Listening","description":"Train your ear","sortOrder":1,"visible":true}
                    """))
            .andExpect(status().isCreated())
            .andReturn();
        long categoryId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        long bookId = createBookViaApi(adminToken, categoryId);

        mockMvc.perform(post("/api/v1/admin/courses")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseBody(bookId)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));

        mockMvc.perform(delete("/api/v1/admin/categories/{id}", categoryId)
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("CATEGORY_HAS_BOOKS"));
    }

    @Test
    void parsesUploadedSubtitleAndPublishesCourseForLearners() throws Exception {
        String adminToken = createUserAndLogin("13800138502", UserRole.ADMIN);
        String learnerToken = createUserAndLogin("13800138503", UserRole.USER);
        CourseCategory category = createCategory("Work");
        long bookId = createBookViaApi(adminToken, category.getId());

        MvcResult created = mockMvc.perform(post("/api/v1/admin/courses")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseBody(bookId)))
            .andExpect(status().isCreated())
            .andReturn();
        long courseId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/v1/admin/courses/{id}/publish", courseId)
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/courses")
                .param("categoryId", category.getId().toString())
                .header("Authorization", bearer(learnerToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].title").value("Office Small Talk"));

        mockMvc.perform(get("/api/v1/courses/{id}", courseId)
                .header("Authorization", bearer(learnerToken)))
            .andExpect(jsonPath("$.cues.length()").value(1))
            .andExpect(jsonPath("$.cues[0].chineseText").value("早上好。"));
    }

    @Test
    void searchesAndDisablesUsers() throws Exception {
        String adminToken = createUserAndLogin("13800138504", UserRole.ADMIN);
        long learnerId = createUser("13800138505", "Lin", UserRole.USER).getId();

        mockMvc.perform(get("/api/v1/admin/users")
                .param("q", "13800138505")
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].nickname").value("Lin"));

        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", learnerId)
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"DISABLED"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DISABLED"));
    }

    @Test
    void returnsDashboardMetrics() throws Exception {
        String adminToken = createUserAndLogin("13800138506", UserRole.ADMIN);
        createUser("13800138507", "Learner", UserRole.USER);

        mockMvc.perform(get("/api/v1/admin/dashboard").header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalLearners").value(1))
            .andExpect(jsonPath("$.completedCourses").value(0));
    }

    private String courseBody(long bookId) {
        return """
            {
              "bookId":%d,
              "title":"Office Small Talk",
              "description":"Start a friendly conversation at work.",
              "coverObjectKey":"covers/office.jpg",
              "audioObjectKey":"audio/office.mp3",
              "subtitleObjectKey":"subtitles/lesson.srt",
              "themeColorPrimary":"#284D43",
              "themeColorSecondary":"#D7B78B",
              "sortOrder":1
            }
            """.formatted(bookId);
    }

    private long createBookViaApi(String adminToken, long categoryId) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/admin/books")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"categoryId":%d,"title":"Work","coverObjectKey":"covers/work.jpg","sortOrder":1,"visible":true}
                    """.formatted(categoryId)))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asLong();
    }

    private CourseCategory createCategory(String name) {
        CourseCategory category = new CourseCategory();
        category.setName(name);
        category.setSortOrder(1);
        category.setVisible(true);
        return categoryRepository.save(category);
    }

    private String createUserAndLogin(String phone, UserRole role) throws Exception {
        createUser(phone, role == UserRole.ADMIN ? "Admin" : "Learner", role);
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

    private User createUser(String phone, String nickname, UserRole role) {
        User user = new User();
        user.setPhone(phone);
        user.setNickname(nickname);
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(role);
        user.setStatus(UserStatus.ENABLED);
        return userRepository.save(user);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
