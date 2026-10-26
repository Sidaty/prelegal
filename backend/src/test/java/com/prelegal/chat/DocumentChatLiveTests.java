package com.prelegal.chat;

import static com.prelegal.chat.DocumentChatServiceTests.EMPTY_DOCUMENT;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Calls the real Gemini API. Opt-in, as it needs GEMINI_API_KEY and uses quota: GEMINI_LIVE_TEST=true mvn test. */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "GEMINI_LIVE_TEST", matches = "true")
class DocumentChatLiveTests {

    private static final ChatMessage GREETING = new ChatMessage("assistant", "Hi! What would you like to draft?");

    @Autowired
    private DocumentChatService service;

    @Test
    void choosesDocumentAndFillsTermsFromFreeformAnswer() {
        ChatResponse response = service.reply(new ChatRequest(List.of(GREETING,
                new ChatMessage("user", "Bonjour, je veux un NDA mutuel entre Acme Inc. (je suis Ada Lovelace, CEO, "
                        + "ada@acme.com) et Globex Corp. Droit du Delaware.")),
                EMPTY_DOCUMENT));

        assertThat(response.reply()).isNotBlank();
        Document document = response.document();
        assertThat(document.type()).isEqualTo("mutual-nda");
        assertThat(document.party1().company()).contains("Acme");
        assertThat(document.party1().name()).isEqualTo("Ada Lovelace");
        assertThat(document.party2().company()).contains("Globex");
        assertThat(document.party2().name()).isEmpty();
        assertThat(document.terms()).contains(new Document.Term("governingLaw", "Delaware"));
    }

    @Test
    void offersClosestDocumentInsteadOfUnsupportedOne() {
        ChatResponse response = service.reply(new ChatRequest(List.of(GREETING,
                new ChatMessage("user", "I need an employment contract for a new software engineer.")),
                EMPTY_DOCUMENT));

        assertThat(response.reply()).isNotBlank();
        assertThat(response.document().type()).isEmpty();
    }
}
