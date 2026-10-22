package com.sayline.englishstudy.auth;

import com.sayline.englishstudy.user.User;
import com.sayline.englishstudy.user.UserRole;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
        @NotBlank
        @Pattern(regexp = "^1\\d{10}$", message = "请输入 11 位手机号")
        String phone,
        @NotBlank
        @Size(min = 8, max = 72, message = "密码长度需为 8-72 个字符")
        String password,
        @NotBlank
        @Size(max = 50, message = "昵称最多 50 个字符")
        String nickname
    ) {
    }

    public record LoginRequest(
        @NotBlank
        @Pattern(regexp = "^1\\d{10}$", message = "请输入 11 位手机号")
        String phone,
        @NotBlank
        String password
    ) {
    }

    public record RefreshRequest(String refreshToken) {
    }

    public record UserView(Long id, String phone, String nickname, UserRole role, String avatarUrl) {

        static UserView from(User user) {
            return new UserView(
                user.getId(),
                user.getPhone(),
                user.getNickname(),
                user.getRole(),
                user.getAvatarObjectKey());
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AuthResponse(String accessToken, String refreshToken, UserView user) {
    }
}
