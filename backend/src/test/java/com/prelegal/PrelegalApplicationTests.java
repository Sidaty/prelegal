package com.prelegal;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
class PrelegalApplicationTests {

    @Autowired
    private MockMvcTester mvc;

    @Test
    void healthReportsUpAndCountsUsers() {
        // The users count depends on other test classes sharing this application context.
        assertThat(mvc.get().uri("/api/health"))
                .hasStatusOk()
                .bodyJson()
                .isLenientlyEqualTo("{\"status\":\"UP\"}")
                .extractingPath("$.users").asNumber().isNotNull();
    }

    @Test
    void forwardsRootToLoginPage() {
        assertThat(mvc.get().uri("/")).hasStatusOk().hasForwardedUrl("index.html");
        assertThat(mvc.get().uri("/index.html")).hasStatusOk().hasBodyTextEqualTo(fixture("login page"));
    }

    @Test
    void servesDirectoryIndexForExportedRoute() {
        assertThat(mvc.get().uri("/app/")).hasStatusOk().hasBodyTextEqualTo(fixture("platform page"));
        assertThat(mvc.get().uri("/app")).hasStatusOk().hasBodyTextEqualTo(fixture("platform page"));
    }

    @Test
    void returnsNotFoundForUnknownPath() {
        assertThat(mvc.get().uri("/missing/")).hasStatus(HttpStatus.NOT_FOUND);
    }

    private static String fixture(String text) {
        return "<html><body>" + text + "</body></html>\n";
    }
}
