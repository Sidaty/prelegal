package com.prelegal.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvcTester mvc;

    private MvcTestResult post(String uri, String email, String password) {
        return mvc.post().uri(uri).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .exchange();
    }

    private static MockHttpSession session(MvcTestResult result) {
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    void signUpSignsTheUserIn() {
        MvcTestResult registered = post("/api/auth/register", "New.User@Example.com", "secret123");

        assertThat(registered).hasStatus(HttpStatus.CREATED).bodyJson().isEqualTo("{\"email\":\"new.user@example.com\"}");
        assertThat(mvc.get().uri("/api/auth/me").session(session(registered)))
                .hasStatusOk().bodyJson().isEqualTo("{\"email\":\"new.user@example.com\"}");
    }

    @Test
    void signInChecksThePassword() {
        post("/api/auth/register", "grace@example.com", "secret123");

        assertThat(post("/api/auth/login", "grace@example.com", "wrong-password")).hasStatus(HttpStatus.UNAUTHORIZED);
        MvcTestResult signedIn = post("/api/auth/login", "Grace@example.com", "secret123");
        assertThat(signedIn).hasStatusOk();
        assertThat(mvc.get().uri("/api/auth/me").session(session(signedIn))).hasStatusOk();
    }

    @Test
    void signOutEndsTheSession() {
        MockHttpSession session = session(post("/api/auth/register", "alan@example.com", "secret123"));

        assertThat(mvc.post().uri("/api/auth/logout").with(csrf()).session(session)).hasStatusOk();
        assertThat(mvc.get().uri("/api/auth/me").session(session)).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsDuplicateEmailAndShortPassword() {
        post("/api/auth/register", "linus@example.com", "secret123");

        assertThat(post("/api/auth/register", "LINUS@example.com", "secret123")).hasStatus(HttpStatus.CONFLICT);
        assertThat(post("/api/auth/register", "ken@example.com", "short")).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(post("/api/auth/register", "not-an-email", "secret123")).hasStatus(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsIncompleteSignInAndPasswordsBcryptCannotHash() {
        assertThat(mvc.post().uri("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .hasStatus(HttpStatus.BAD_REQUEST);
        // 40 accented characters are 80 bytes, over BCrypt's 72-byte limit.
        assertThat(post("/api/auth/register", "accents@example.com", "é".repeat(40))).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(post("/api/auth/register", "ascii@example.com", "a".repeat(72))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void requiresASessionAndACsrfToken() {
        assertThat(mvc.get().uri("/api/auth/me")).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.post().uri("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"eve@example.com\",\"password\":\"secret123\"}"))
                .hasStatus(HttpStatus.FORBIDDEN);
    }
}
