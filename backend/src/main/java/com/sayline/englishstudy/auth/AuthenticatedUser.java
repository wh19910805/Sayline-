package com.sayline.englishstudy.auth;

import com.sayline.englishstudy.user.UserRole;

public record AuthenticatedUser(Long id, String phone, String nickname, UserRole role) {
}
