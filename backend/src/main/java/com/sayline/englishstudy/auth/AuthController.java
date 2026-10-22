package com.sayline.englishstudy.auth;

import java.time.Duration;

import com.sayline.englishstudy.auth.AuthDtos.AuthResponse;
import com.sayline.englishstudy.auth.AuthDtos.LoginRequest;
import com.sayline.englishstudy.auth.AuthDtos.RefreshRequest;
import com.sayline.englishstudy.auth.AuthDtos.RegisterRequest;
import com.sayline.englishstudy.auth.AuthDtos.UserView;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;
    private final boolean secureCookie;
    private final long refreshTokenDays;

    public AuthController(
        AuthService authService,
        @Value("${app.cookie-secure}") boolean secureCookie,
        @Value("${app.refresh-token-days}") long refreshTokenDays
    ) {
        this.authService = authService;
        this.secureCookie = secureCookie;
        this.refreshTokenDays = refreshTokenDays;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        @RequestHeader(value = "X-Client-Type", defaultValue = "web") String clientType
    ) {
        return authResponse(authService.register(request), HttpStatus.CREATED, clientType);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        @RequestHeader(value = "X-Client-Type", defaultValue = "web") String clientType
    ) {
        return authResponse(authService.login(request), HttpStatus.OK, clientType);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
        @RequestBody(required = false) RefreshRequest request,
        @RequestHeader(value = "X-Client-Type", defaultValue = "web") String clientType,
        HttpServletRequest servletRequest
    ) {
        String token = cookieValue(servletRequest);
        if ((token == null || token.isBlank()) && request != null) {
            token = request.refreshToken();
        }
        return authResponse(authService.refresh(token), HttpStatus.OK, clientType);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @RequestBody(required = false) RefreshRequest request,
        HttpServletRequest servletRequest
    ) {
        String token = cookieValue(servletRequest);
        if ((token == null || token.isBlank()) && request != null) {
            token = request.refreshToken();
        }
        authService.logout(token);
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
            .build();
    }

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.currentUser(user.id());
    }

    private ResponseEntity<AuthResponse> authResponse(AuthResult result, HttpStatus status, String clientType) {
        AuthResponse response = "native".equalsIgnoreCase(clientType)
            ? new AuthResponse(result.response().accessToken(), result.refreshToken(), result.response().user())
            : result.response();
        return ResponseEntity.status(status)
            .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken(), Duration.ofDays(refreshTokenDays)).toString())
            .body(response);
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
            .httpOnly(true)
            .secure(secureCookie)
            .sameSite("Lax")
            .path("/api/v1/auth")
            .maxAge(maxAge)
            .build();
    }

    private String cookieValue(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
