package com.sayline.englishstudy.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

import com.sayline.englishstudy.auth.AuthDtos.AuthResponse;
import com.sayline.englishstudy.auth.AuthDtos.LoginRequest;
import com.sayline.englishstudy.auth.AuthDtos.RegisterRequest;
import com.sayline.englishstudy.auth.AuthDtos.UserView;
import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserRepository;
import com.sayline.englishstudy.user.UserRole;
import com.sayline.englishstudy.user.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final Duration refreshTokenTtl;

    public AuthService(
        UserRepository userRepository,
        RefreshSessionRepository refreshSessionRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        @Value("${app.refresh-token-days}") long refreshTokenDays
    ) {
        this.userRepository = userRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenTtl = Duration.ofDays(refreshTokenDays);
    }

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String phone = request.phone().trim();
        if (userRepository.existsByPhone(phone)) {
            throw new ApiException("PHONE_ALREADY_REGISTERED", HttpStatus.CONFLICT, "该手机号已注册");
        }

        User user = new User();
        user.setPhone(phone);
        user.setNickname(request.nickname().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ENABLED);
        user.setLastLoginAt(Instant.now());
        return issue(userRepository.save(user));
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByPhone(request.phone().trim())
            .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        ensureEnabled(user);
        user.setLastLoginAt(Instant.now());
        return issue(user);
    }

    @Transactional
    public AuthResult refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "登录已过期，请重新登录");
        }
        RefreshSession session = refreshSessionRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(this::invalidRefreshToken);
        if (session.getRevokedAt() != null || !session.getExpiresAt().isAfter(Instant.now())) {
            throw invalidRefreshToken();
        }
        ensureEnabled(session.getUser());
        session.setRevokedAt(Instant.now());
        session.setLastUsedAt(Instant.now());
        return issue(session.getUser());
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshSessionRepository.findByTokenHash(hash(rawToken)).ifPresent(session -> {
            if (session.getRevokedAt() == null) {
                session.setRevokedAt(Instant.now());
            }
        });
    }

    @Transactional(readOnly = true)
    public UserView currentUser(Long userId) {
        return userRepository.findById(userId)
            .map(UserView::from)
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", HttpStatus.UNAUTHORIZED, "登录用户不存在"));
    }

    private AuthResult issue(User user) {
        String rawRefreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        RefreshSession session = new RefreshSession();
        session.setId(UUID.randomUUID().toString());
        session.setUser(user);
        session.setTokenHash(hash(rawRefreshToken));
        session.setCreatedAt(Instant.now());
        session.setExpiresAt(Instant.now().plus(refreshTokenTtl));
        refreshSessionRepository.save(session);

        String accessToken = jwtService.issue(user);
        return new AuthResult(new AuthResponse(accessToken, null, UserView.from(user)), rawRefreshToken);
    }

    private void ensureEnabled(User user) {
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ApiException("ACCOUNT_DISABLED", HttpStatus.FORBIDDEN, "账号已停用，请联系管理员");
        }
    }

    private ApiException invalidCredentials() {
        return new ApiException("INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "手机号或密码错误");
    }

    private ApiException invalidRefreshToken() {
        return new ApiException("INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED, "登录已过期，请重新登录");
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
