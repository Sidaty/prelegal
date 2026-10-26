package com.prelegal.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import com.jayway.jsonpath.JsonPath;
import com.prelegal.user.User;
import com.prelegal.user.UserRepository;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

@SpringBootTest
@AutoConfigureMockMvc
class DocumentControllerTests {

    private static final String OWNER = "owner@example.com";
    private static final String OTHER = "other@example.com";

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private UserRepository users;

    @BeforeEach
    void createUsers() {
        for (String email : new String[] {OWNER, OTHER}) {
            if (users.findByEmail(email).isEmpty()) {
                users.save(new User(email, "{noop}secret123"));
            }
        }
    }

    private static String draft(String title, String company) {
        return """
                {"title":"%s",
                 "document":{"type":"mutual-nda","terms":[{"key":"governingLaw","value":"Delaware"}],
                             "party1":{"name":"Ada","title":"CEO","company":"%s","noticeAddress":""},
                             "party2":{"name":"","title":"","company":"","noticeAddress":""}},
                 "messages":[{"role":"assistant","text":"Hi"},{"role":"user","text":"An NDA please"}]}
                """.formatted(title, company);
    }

    private MvcTestResult create(String email, String title) {
        return mvc.post().uri("/api/documents").with(user(email)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(draft(title, "Acme")).exchange();
    }

    private Integer createdId(String email, String title) {
        byte[] body = create(email, title).getResponse().getContentAsByteArray();
        return JsonPath.read(new String(body, StandardCharsets.UTF_8), "$.id");
    }

    @Test
    void createsAndReopensADocumentWithItsConversation() {
        assertThat(create(OWNER, "Mutual NDA with Globex")).hasStatus(HttpStatus.CREATED).bodyJson().isLenientlyEqualTo("""
                {"title":"Mutual NDA with Globex",
                 "document":{"type":"mutual-nda","party1":{"company":"Acme"}},
                 "messages":[{"role":"assistant","text":"Hi"},{"role":"user","text":"An NDA please"}]}
                """);
    }

    @Test
    void updatesAndListsTheMostRecentFirst() {
        Integer first = createdId(OWNER, "First");
        Integer second = createdId(OWNER, "Second");

        assertThat(mvc.put().uri("/api/documents/" + first).with(user(OWNER)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(draft("First, renamed", "Acme Corp")))
                .hasStatusOk().bodyJson().extractingPath("$.document.party1.company").isEqualTo("Acme Corp");

        assertThat(mvc.get().uri("/api/documents").with(user(OWNER)))
                .hasStatusOk().bodyJson()
                .extractingPath("$[?(@.id in [%d, %d])].title".formatted(first, second))
                .asArray().containsExactly("First, renamed", "Second");
    }

    @Test
    void hidesOtherUsersDocuments() {
        Integer id = createdId(OWNER, "Private");

        assertThat(mvc.get().uri("/api/documents/" + id).with(user(OTHER))).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(mvc.put().uri("/api/documents/" + id).with(user(OTHER)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(draft("Hijacked", "Evil"))).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(mvc.get().uri("/api/documents").with(user(OTHER)))
                .hasStatusOk().bodyJson().extractingPath("$[*].title").asArray().doesNotContain("Private");
    }

    @Test
    void rejectsInvalidDraftsAndAnonymousRequests() {
        assertThat(mvc.post().uri("/api/documents").with(user(OWNER)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(draft("x".repeat(256), "Acme")))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(mvc.post().uri("/api/documents").with(user(OWNER)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\",\"messages\":[]}"))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(mvc.get().uri("/api/documents")).hasStatus(HttpStatus.UNAUTHORIZED);
    }
}
