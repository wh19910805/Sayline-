package com.sayline.englishstudy.storage;

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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UploadApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

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
        when(storageService.presignUpload(any(), anyString(), anyLong()))
            .thenReturn("http://localhost:9000/sayline-media/test-upload");
    }

    @Test
    void rejectsAnonymousUploadRequests() throws Exception {
        mockMvc.perform(post("/api/v1/admin/uploads/presign")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"AUDIO","fileName":"lesson.mp3","contentType":"audio/mpeg","sizeBytes":1024}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsLearnerUploadRequests() throws Exception {
        String token = createUserAndLogin("13800138400", UserRole.USER);

        mockMvc.perform(post("/api/v1/admin/uploads/presign")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"AUDIO","fileName":"lesson.mp3","contentType":"audio/mpeg","sizeBytes":1024}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void createsPresignedUploadForAdmin() throws Exception {
        String token = createUserAndLogin("13800138401", UserRole.ADMIN);

        mockMvc.perform(post("/api/v1/admin/uploads/presign")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"AUDIO","fileName":"lesson.mp3","contentType":"audio/mpeg","sizeBytes":1024}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.uploadUrl").value("http://localhost:9000/sayline-media/test-upload"))
            .andExpect(jsonPath("$.objectKey").value(org.hamcrest.Matchers.startsWith("audio/")));
    }

    @Test
    void rejectsUnsupportedFileTypesAndOversizedFiles() throws Exception {
        String token = createUserAndLogin("13800138402", UserRole.ADMIN);

        mockMvc.perform(post("/api/v1/admin/uploads/presign")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"AUDIO","fileName":"lesson.exe","contentType":"application/octet-stream","sizeBytes":1024}
                    """))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("INVALID_UPLOAD_TYPE"));

        mockMvc.perform(post("/api/v1/admin/uploads/presign")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"AUDIO","fileName":"lesson.mp3","contentType":"audio/mpeg","sizeBytes":104857601}
                    """))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("UPLOAD_TOO_LARGE"));
    }

    @Test
    void allowsLearnerToPresignAnAvatarCover() throws Exception {
        String token = createUserAndLogin("13800138403", UserRole.USER);

        mockMvc.perform(post("/api/v1/uploads/avatar/presign")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"kind":"COVER","fileName":"avatar.png","contentType":"image/png","sizeBytes":2048}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.objectKey").value(org.hamcrest.Matchers.startsWith("covers/")));
    }

    private String createUserAndLogin(String phone, UserRole role) throws Exception {
        User user = new User();
        user.setPhone(phone);
        user.setNickname("Uploader");
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(role);
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

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
