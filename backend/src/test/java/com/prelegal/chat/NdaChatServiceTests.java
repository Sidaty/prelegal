package com.prelegal.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.genai.types.Content;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NdaChatServiceTests {

    static final NdaData.Party EMPTY_PARTY = new NdaData.Party("", "", "", "");
    static final NdaData EMPTY_NDA = new NdaData(
            "", "", "expires", 1, "years", 1, "", "", "", EMPTY_PARTY, EMPTY_PARTY);

    @Autowired
    private NdaChatService service;

    @Test
    void systemPromptIncludesTodayAndCurrentFields() {
        NdaData nda = new NdaData("Evaluate a partnership", "", "expires", 2, "perpetual", 1, "Delaware", "", "",
                new NdaData.Party("Ada Lovelace", "CEO", "Acme Inc.", "ada@acme.com"), EMPTY_PARTY);

        String prompt = service.systemPrompt(nda, LocalDate.of(2026, 10, 26));

        assertThat(prompt)
                .contains("Today's date is 2026-10-26.")
                .contains("\"governingLaw\":\"Delaware\"")
                .contains("\"company\":\"Acme Inc.\"")
                .doesNotContain("{today}", "{nda}");
    }

    @Test
    void mapsAssistantRoleToGeminiModelRole() {
        List<Content> contents = NdaChatService.toContents(List.of(
                new ChatMessage("assistant", "Who are the parties?"),
                new ChatMessage("user", "Acme and Globex")));

        assertThat(contents).extracting(content -> content.role().orElseThrow()).containsExactly("model", "user");
        assertThat(contents.get(1).text()).isEqualTo("Acme and Globex");
    }
}
