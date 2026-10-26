package com.prelegal.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataAccessException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTests {

    @Autowired
    private UserRepository users;

    @Test
    void savesAndFindsUserByEmail() {
        users.save(new User("ada@example.com", "hash"));

        User found = users.findByEmail("ada@example.com").orElseThrow();

        assertThat(found.getId()).isNotNull();
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void rejectsDuplicateEmail() {
        users.saveAndFlush(new User("bob@example.com", "hash"));

        assertThatThrownBy(() -> users.saveAndFlush(new User("bob@example.com", "other")))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("UNIQUE");
    }
}
