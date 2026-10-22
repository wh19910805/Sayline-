package com.sayline.englishstudy.auth;

import com.sayline.englishstudy.auth.AuthDtos.AuthResponse;

public record AuthResult(AuthResponse response, String refreshToken) {
}
