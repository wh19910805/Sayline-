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
            "admin_audit_logs", "content_import_jobs", "password_reset_tokens",
            "review_cue_states", "learning_cue_progress", "dictation_attempts", "learning_daily_stats",
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
        when(storageService.readText(eq("subtitles/imported.srt"))).thenReturn("""
            1
            00:00:00,000 --> 00:00:02,000
            A new lesson.
            一节新课。
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
    void returnsActionableContentHealthAndAuditData() throws Exception {
        String adminToken = createUserAndLogin("13800138512", UserRole.ADMIN);

        mockMvc.perform(get("/api/v1/admin/content-health")
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.publishedCourses").value(0))
            .andExpect(jsonPath("$.issues").isArray())
            .andExpect(jsonPath("$.auditLogs").isArray());
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
    void replacesSubtitleCuesForPublishedCourse() throws Exception {
        String adminToken = createUserAndLogin("13800138510", UserRole.ADMIN);
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
            .andExpect(status().isOk());
        when(storageService.readText(eq("subtitles/updated.srt"))).thenReturn("""
            1
            00:00:00,000 --> 00:00:02,000
            Good afternoon.
            下午好。
            """);

        mockMvc.perform(patch("/api/v1/admin/courses/{id}", courseId)
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseBody(bookId).replace("subtitles/lesson.srt", "subtitles/updated.srt")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.subtitleObjectKey").value("subtitles/updated.srt"));

        mockMvc.perform(get("/api/v1/courses/{id}", courseId)
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.cues.length()").value(1))
            .andExpect(jsonPath("$.cues[0].chineseText").value("下午好。"));
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
            .andExpect(jsonPath("$.completedCourses").value(0))
            .andExpect(jsonPath("$.studyTrend.length()").value(7));
    }

    @Test
    void batchUpdatesBookVisibility() throws Exception {
        String adminToken = createUserAndLogin("13800138508", UserRole.ADMIN);
        CourseCategory category = createCategory("Work");
        long firstId = createBookViaApi(adminToken, category.getId());
        long secondId = createBookViaApi(adminToken, category.getId());

        mockMvc.perform(patch("/api/v1/admin/books/batch-visibility")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"bookIds":[%d,%d],"visible":false}
                    """.formatted(firstId, secondId)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/books")
                .param("categoryId", category.getId().toString())
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].visible").value(false))
            .andExpect(jsonPath("$.content[1].visible").value(false));
    }

    @Test
    void filtersAdminBooksByQueryCategoryAndVisibility() throws Exception {
        String adminToken = createUserAndLogin("13800138509", UserRole.ADMIN);
        CourseCategory work = createCategory("Work");
        CourseCategory listening = createCategory("Listening");
        createBookViaApi(adminToken, work.getId(), "Office Meeting", true);
        createBookViaApi(adminToken, listening.getId(), "Morning Listening", false);

        mockMvc.perform(get("/api/v1/admin/books")
                .param("q", "morning")
                .param("categoryId", listening.getId().toString())
                .param("visible", "false")
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Morning Listening"));
    }

    @Test
    void previewsImportsDuplicatesAndRollsBackCreatedLessons() throws Exception {
        String adminToken = createUserAndLogin("13800138511", UserRole.ADMIN);
        CourseCategory category = createCategory("Imports");
        long bookId = createBookViaApi(adminToken, category.getId(), "Import Book", true);
        mockMvc.perform(post("/api/v1/admin/courses")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseBody(bookId)))
            .andExpect(status().isCreated());
        when(storageService.objectMd5("audio/office.mp3")).thenReturn("11111111111111111111111111111111");

        String previewBody = """
            {
              "type":"CREATE",
              "bookId":%d,
              "items":[
                {"sourceName":"old.mp3","title":"Office Small Talk","audioMd5":"11111111111111111111111111111111","durationMs":1000},
                {"sourceName":"new.mp3","title":"Imported Lesson","audioMd5":"22222222222222222222222222222222","durationMs":1000}
              ]
            }
            """.formatted(bookId);
        mockMvc.perform(post("/api/v1/admin/imports/preview")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(previewBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ready").value(1))
            .andExpect(jsonPath("$.items[0].status").value("DUPLICATE"))
            .andExpect(jsonPath("$.items[1].status").value("READY"));

        String executeBody = """
            {
              "type":"CREATE",
              "bookId":%d,
              "resetLearning":false,
              "items":[
                {"sourceName":"old.mp3","title":"Office Small Talk","audioMd5":"11111111111111111111111111111111","durationMs":1000},
                {
                  "sourceName":"new.mp3",
                  "title":"Imported Lesson",
                  "audioMd5":"22222222222222222222222222222222",
                  "durationMs":1000,
                  "audioObjectKey":"audio/imported.mp3",
                  "subtitleObjectKey":"subtitles/imported.srt"
                }
              ]
            }
            """.formatted(bookId);
        MvcResult executed = mockMvc.perform(post("/api/v1/admin/imports")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(executeBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(1))
            .andExpect(jsonPath("$.skipped").value(1))
            .andExpect(jsonPath("$.failed").value(0))
            .andReturn();
        JsonNode job = objectMapper.readTree(executed.getResponse().getContentAsString());
        long jobId = job.get("id").asLong();
        long createdCourseId = job.get("items").get(1).get("courseId").asLong();

        mockMvc.perform(post("/api/v1/admin/imports/{id}/rollback", jobId)
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ROLLED_BACK"));

        mockMvc.perform(get("/api/v1/admin/courses/{id}", createdCourseId)
                .header("Authorization", bearer(adminToken)))
            .andExpect(status().isNotFound());
    }

    @Test
    void executesSubtitleImportMatchedByAudioWhenRequestOmitsCourseId() throws Exception {
        String adminToken = createUserAndLogin("13800138513", UserRole.ADMIN);
        CourseCategory category = createCategory("Subtitle Imports");
        long bookId = createBookViaApi(adminToken, category.getId(), "Subtitle Book", true);
        MvcResult created = mockMvc.perform(post("/api/v1/admin/courses")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(courseBody(bookId)))
            .andExpect(status().isCreated())
            .andReturn();
        long courseId = objectMapper.readTree(created.getResponse().getContentAsString())
            .get("id").asLong();
        when(storageService.objectMd5("audio/office.mp3"))
            .thenReturn("11111111111111111111111111111111");

        String body = """
            {
              "type":"SUBTITLE",
              "bookId":null,
              "resetLearning":true,
              "items":[
                {
                  "sourceName":"office",
                  "title":"office",
                  "audioMd5":"11111111111111111111111111111111",
                  "subtitleMd5":"33333333333333333333333333333333",
                  "subtitleObjectKey":"subtitles/imported.srt",
                  "durationMs":1000
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/v1/admin/imports/preview")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("\"resetLearning\":true,", "")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].status").value("READY"))
            .andExpect(jsonPath("$.items[0].courseId").value(courseId));

        mockMvc.perform(post("/api/v1/admin/imports")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(1))
            .andExpect(jsonPath("$.failed").value(0))
            .andExpect(jsonPath("$.items[0].courseId").value(courseId));
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
        return createBookViaApi(adminToken, categoryId, "Work", true);
    }

    private long createBookViaApi(
        String adminToken,
        long categoryId,
        String title,
        boolean visible
    ) throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/admin/books")
                .header("Authorization", bearer(adminToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"categoryId":%d,"title":"%s","coverObjectKey":"covers/work.jpg","sortOrder":1,"visible":%s}
                    """.formatted(categoryId, title, visible)))
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
