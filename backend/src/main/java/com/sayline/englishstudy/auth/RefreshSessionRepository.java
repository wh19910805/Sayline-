package com.sayline.englishstudy.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, String> {

    Optional<RefreshSession> findByTokenHash(String tokenHash);
}
