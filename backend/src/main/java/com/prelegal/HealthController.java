package com.prelegal;

import com.prelegal.user.UserRepository;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Reports that the API is up and the database is reachable. */
@RestController
public class HealthController {

    private final UserRepository users;

    public HealthController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "users", users.count());
    }
}
