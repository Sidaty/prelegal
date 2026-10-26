package com.prelegal.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.genai.types.Content;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class DocumentChatServiceTests {

    static final Document.Party EMPTY_PARTY = new Document.Party("", "", "", "");
    static final Document EMPTY_DOCUMENT = new Document("", EMPTY_PARTY, EMPTY_PARTY, List.of());

    @Autowired
    private DocumentChatService service;

    @Test
    void systemPromptIncludesCatalogTodayAndCurrentDocument() {
        Document document = new Document("cloud-service-agreement",
                new Document.Party("Ada Lovelace", "CEO", "Acme Inc.", "ada@acme.com"), EMPTY_PARTY,
                List.of(new Document.Term("governingLaw", "Delaware")));

        String prompt = service.systemPrompt(document, LocalDate.of(2026, 10, 26));

        assertThat(prompt)
                .contains("- cloud-service-agreement: Cloud Service Agreement.")
                .contains("party1 is the Provider, party2 is the Customer.")
                .contains("  - generalCapAmount (General Cap Amount): ")
                .contains("Today's date is 2026-10-26.")
                .contains("\"company\":\"Acme Inc.\"")
                .contains("{\"key\":\"governingLaw\",\"value\":\"Delaware\"}")
                .doesNotContain("{catalog}", "{today}", "{document}");
    }

    @Test
    @SuppressWarnings("unchecked")
    void schemaRestrictsDocumentTypesAndTermKeysToTheCatalog() {
        Map<String, Object> document = property(service.responseSchema(), "document");
        Map<String, Object> type = property(document, "type");
        Map<String, Object> term = (Map<String, Object>) property(document, "terms").get("items");
        Map<String, Object> key = property(term, "key");

        assertThat((List<String>) type.get("enum"))
                .hasSize(12)
                .startsWith("")
                .contains("mutual-nda", "cloud-service-agreement", "software-license-agreement");
        assertThat((List<String>) key.get("enum"))
                .contains("purpose", "mndaTerm", "generalCapAmount", "targetUptime", "approvedSubprocessors")
                .doesNotHaveDuplicates();
    }

    @Test
    void mapsAssistantRoleToGeminiModelRole() {
        List<Content> contents = DocumentChatService.toContents(List.of(
                new ChatMessage("assistant", "What do you need?"),
                new ChatMessage("user", "An NDA")));

        assertThat(contents).extracting(content -> content.role().orElseThrow()).containsExactly("model", "user");
        assertThat(contents.get(1).text()).isEqualTo("An NDA");
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> property(Map<?, ?> schema, String name) {
        return (Map<String, Object>) ((Map<String, Object>) schema.get("properties")).get(name);
    }
}
