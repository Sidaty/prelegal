package com.prelegal.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Persistence access for {@link User}. */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
}
