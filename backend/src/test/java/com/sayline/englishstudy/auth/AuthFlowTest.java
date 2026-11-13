package com.sayline.englishstudy.auth;

import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserRepository;
import com.sayline.englishstudy.user.UserRole;
import com.sayline.englishstudy.user.UserStatus;
import jakarta.servlet.http.Cookie;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AccountSecurityService accountSecurityService;

    @BeforeEach
    void cleanUsers() {
        jdbcTemplate.update("delete from admin_audit_logs");
        jdbcTemplate.update("delete from content_import_jobs");
        jdbcTemplate.update("delete from password_reset_tokens");
        jdbcTemplate.update("delete from refresh_sessions");
        userRepository.deleteAll();
    }

    @Test
    void registersUserAndIssuesAccessAndRefreshTokens() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138000","password":"Sayline123","nickname":"Lin"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.user.phone").value("13800138000"))
            .andExpect(jsonPath("$.user.role").value("USER"))
            .andExpect(cookie().httpOnly("refresh_token", true));
    }

    @Test
    void rejectsDuplicatePhone() throws Exception {
        register("13800138001");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138001","password":"Sayline123","nickname":"Other"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PHONE_ALREADY_REGISTERED"));
    }

    @Test
    void rejectsInvalidPasswordWithoutRevealingWhetherAccountExists() throws Exception {
        register("13800138002");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138002","password":"WrongPassword"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void rotatesRefreshTokenAndRejectsTheOldToken() throws Exception {
        MvcResult registered = register("13800138003");
        Cookie original = registered.getResponse().getCookie("refresh_token");
        assertThat(original).isNotNull();

        MvcResult refreshed = mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(original))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(cookie().exists("refresh_token"))
            .andReturn();

        Cookie rotated = refreshed.getResponse().getCookie("refresh_token");
        assertThat(rotated).isNotNull();
        assertThat(rotated.getValue()).isNotEqualTo(original.getValue());

        mockMvc.perform(post("/api/v1/auth/refresh")
                .cookie(original))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsDisabledUserAtLogin() throws Exception {
        User user = new User();
        user.setPhone("13800138004");
        user.setNickname("Disabled");
        user.setPasswordHash(passwordEncoder.encode("Sayline123"));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.DISABLED);
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138004","password":"Sayline123"}
                    """))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));
    }

    @Test
    void resetsPasswordWithOneTimeAdminToken() throws Exception {
        register("13800138005");
        User user = userRepository.findByPhone("13800138005").orElseThrow();
        String token = accountSecurityService.issuePasswordResetToken(user.getId()).token();

        mockMvc.perform(post("/api/v1/auth/password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138005","token":"%s","newPassword":"NewPassword123"}
                    """.formatted(token)))
            .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138005","password":"NewPassword123"}
                    """))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"13800138005","token":"%s","newPassword":"AnotherPassword123"}
                    """.formatted(token)))
            .andExpect(status().isUnauthorized());
    }

    private MvcResult register(String phone) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"phone":"%s","password":"Sayline123","nickname":"Learner"}
                    """.formatted(phone)))
            .andExpect(status().isCreated())
            .andReturn();
    }
}
