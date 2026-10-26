package com.prelegal.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Sign up, sign in and current user; sign out is handled by Spring Security at /api/auth/logout. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** BCrypt only hashes the first 72 bytes of a password and Spring Security rejects longer ones. */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;

    public AuthController(UserRepository users, PasswordEncoder encoder, AuthenticationManager authenticationManager) {
        this.users = users;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
    }

    /** Email and password sent to sign up or sign in; the email is compared case-insensitively. */
    public record Credentials(@NotBlank @Email String email, @NotNull String password) {

        public Credentials {
            email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
        }
    }

    /** The signed-in user, as returned to the frontend. */
    public record CurrentUser(String email) {
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CurrentUser register(@Valid @RequestBody Credentials credentials,
            HttpServletRequest request, HttpServletResponse response) {
        int passwordBytes = credentials.password().getBytes(StandardCharsets.UTF_8).length;
        if (credentials.password().length() < 8 || passwordBytes > MAX_PASSWORD_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a password of 8 to 72 characters.");
        }
        if (users.findByEmail(credentials.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for this email.");
        }
        users.save(new User(credentials.email(), encoder.encode(credentials.password())));
        return signIn(credentials, request, response);
    }

    @PostMapping("/login")
    public CurrentUser login(@Valid @RequestBody Credentials credentials,
            HttpServletRequest request, HttpServletResponse response) {
        return signIn(credentials, request, response);
    }

    @GetMapping("/me")
    public CurrentUser me(Principal principal) {
        return new CurrentUser(principal.getName());
    }

    /** Authenticates and stores the user in a new session; bad credentials end in a 401. */
    private CurrentUser signIn(Credentials credentials, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(credentials.email(), credentials.password()));
        // A new session id on sign in prevents session fixation; changeSessionId needs an existing session.
        request.getSession();
        request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        return new CurrentUser(authentication.getName());
    }
}
