package com.sayline.englishstudy.auth;

import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, String> {

    Optional<RefreshSession> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
        update RefreshSession session
        set session.revokedAt = :revokedAt
        where session.user.id = :userId and session.revokedAt is null
        """)
    void revokeAllForUser(@Param("userId") Long userId, @Param("revokedAt") Instant revokedAt);
}
