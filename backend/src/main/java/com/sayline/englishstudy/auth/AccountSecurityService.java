package com.sayline.englishstudy.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import com.sayline.englishstudy.common.ApiException;
import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserProfileDtos.PasswordResetRequest;
import com.sayline.englishstudy.user.UserProfileDtos.PasswordResetTokenView;
import com.sayline.englishstudy.user.UserProfileDtos.PhoneChangeRequest;
import com.sayline.englishstudy.user.UserProfileDtos.SessionView;
import com.sayline.englishstudy.user.UserRepository;
import com.sayline.englishstudy.user.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountSecurityService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetRepository;
    private final RefreshSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccountSecurityService(
        UserRepository userRepository,
        PasswordResetTokenRepository resetRepository,
        RefreshSessionRepository sessionRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.resetRepository = resetRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public PasswordResetTokenView issuePasswordResetToken(Long userId) {
        User user = requiredUser(userId);
        byte[] bytes = new byte[18];
        secureRandom.nextBytes(bytes);
        String rawToken = HexFormat.of().formatHex(bytes);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(30 * 60));
        resetRepository.save(token);
        return new PasswordResetTokenView(rawToken, token.getExpiresAt());
    }

    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        User user = userRepository.findByPhone(request.phone().trim())
            .orElseThrow(this::invalidResetToken);
        PasswordResetToken token = resetRepository.findByTokenHash(hash(request.token().trim()))
            .orElseThrow(this::invalidResetToken);
        if (!token.getUser().getId().equals(user.getId())
            || token.getUsedAt() != null
            || !token.getExpiresAt().isAfter(Instant.now())) {
            throw invalidResetToken();
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        token.setUsedAt(Instant.now());
        sessionRepository.revokeAllForUser(user.getId(), Instant.now());
    }

    @Transactional
    public void changePhone(Long userId, PhoneChangeRequest request) {
        User user = requiredUser(userId);
        verifyPassword(user, request.currentPassword());
        String phone = request.newPhone().trim();
        if (!phone.equals(user.getPhone()) && userRepository.existsByPhone(phone)) {
            throw new ApiException("PHONE_ALREADY_REGISTERED", HttpStatus.CONFLICT, "该手机号已被使用");
        }
        user.setPhone(phone);
    }

    @Transactional
    public void deleteAccount(Long userId, String currentPassword) {
        User user = requiredUser(userId);
        verifyPassword(user, currentPassword);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        user.setPhone("d" + user.getId() + "_" + suffix.substring(0, 6));
        user.setNickname("已注销用户");
        user.setAvatarObjectKey(null);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setStatus(UserStatus.DISABLED);
        user.setLastLoginAt(null);
        sessionRepository.revokeAllForUser(userId, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<SessionView> sessions(Long userId) {
        List<RefreshSession> sessions = sessionRepository
            .findByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(userId, Instant.now());
        return java.util.stream.IntStream.range(0, sessions.size())
            .mapToObj(index -> {
                RefreshSession session = sessions.get(index);
                return new SessionView(
                    session.getId(),
                    session.getUserAgent(),
                    session.getIpAddress(),
                    session.getCreatedAt(),
                    session.getLastUsedAt(),
                    session.getExpiresAt(),
                    index == 0);
            })
            .toList();
    }

    @Transactional
    public void revokeSession(Long userId, String sessionId) {
        RefreshSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new ApiException("SESSION_NOT_FOUND", HttpStatus.NOT_FOUND, "登录设备不存在"));
        if (session.getRevokedAt() == null) {
            session.setRevokedAt(Instant.now());
        }
    }

    private User requiredUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("USER_NOT_FOUND", HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private void verifyPassword(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException("INVALID_PASSWORD", HttpStatus.UNAUTHORIZED, "当前密码不正确");
        }
    }

    private ApiException invalidResetToken() {
        return new ApiException("INVALID_RESET_TOKEN", HttpStatus.UNAUTHORIZED, "重置码无效或已过期");
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
