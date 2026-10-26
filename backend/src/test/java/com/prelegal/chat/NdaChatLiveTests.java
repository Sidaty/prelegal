package com.prelegal.chat;

import static com.prelegal.chat.NdaChatServiceTests.EMPTY_NDA;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Calls the real Gemini API. Opt-in, as it needs GEMINI_API_KEY and uses quota: GEMINI_LIVE_TEST=true mvn test. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "GEMINI_LIVE_TEST", matches = "true")
class NdaChatLiveTests {

    @Autowired
    private NdaChatService service;

    @Test
    void fillsFieldsFromFreeformAnswer() {
        ChatResponse response = service.reply(new ChatRequest(List.of(
                new ChatMessage("assistant", "Hi! Which two companies are entering into this NDA?"),
                new ChatMessage("user", "Bonjour, c'est entre Acme Inc. (je suis Ada Lovelace, CEO, ada@acme.com) "
                        + "et Globex Corp. Droit du Delaware.")),
                EMPTY_NDA));

        assertThat(response.reply()).isNotBlank();
        NdaData nda = response.nda();
        assertThat(nda.party1().company()).contains("Acme");
        assertThat(nda.party1().name()).isEqualTo("Ada Lovelace");
        assertThat(nda.party1().noticeAddress()).isEqualTo("ada@acme.com");
        assertThat(nda.party2().company()).contains("Globex");
        assertThat(nda.governingLaw()).isEqualTo("Delaware");
        assertThat(nda.party2().name()).isEmpty();
    }
}
