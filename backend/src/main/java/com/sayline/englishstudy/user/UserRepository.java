package com.sayline.englishstudy.user;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    long countByRole(UserRole role);

    @Query("""
        select u from User u
        where (:query is null
          or u.phone like concat('%', :query, '%')
          or lower(u.nickname) like lower(concat('%', :query, '%')))
        """)
    Page<User> search(@Param("query") String query, Pageable pageable);
}
