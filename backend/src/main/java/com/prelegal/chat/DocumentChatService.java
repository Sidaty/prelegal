package com.prelegal.chat;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/** Drives the drafting chat: sends the conversation to Gemini and reads back its structured reply. */
@Service
public class DocumentChatService {

    private final Client client;
    private final JsonMapper json;
    private final String model;
    private final Map<?, ?> responseSchema;
    private final String promptTemplate;

    public DocumentChatService(
            Client client,
            JsonMapper json,
            DocumentCatalog catalog,
            @Value("${gemini.model}") String model,
            @Value("classpath:chat/response-schema.json") Resource responseSchema,
            @Value("classpath:chat/system-prompt.txt") Resource promptTemplate) throws IOException {
        this.client = client;
        this.json = json;
        this.model = model;
        this.responseSchema = json.readValue(responseSchema(catalog, responseSchema), Map.class);
        this.promptTemplate = promptTemplate.getContentAsString(StandardCharsets.UTF_8)
                .replace("{catalog}", catalog.describe());
    }

    public ChatResponse reply(ChatRequest request) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(systemPrompt(request.document(), LocalDate.now()))))
                .responseMimeType("application/json")
                .responseJsonSchema(responseSchema)
                .build();
        String output = client.models.generateContent(model, toContents(request.messages()), config).text();
        return json.readValue(output, ChatResponse.class);
    }

    Map<?, ?> responseSchema() {
        return responseSchema;
    }

    /** Fills the prompt template with today's date and the current document. */
    String systemPrompt(Document document, LocalDate today) {
        return promptTemplate
                .replace("{today}", today.toString())
                .replace("{document}", json.writeValueAsString(document));
    }

    /** Restricts the schema's document types and term keys to those in the catalog. */
    private String responseSchema(DocumentCatalog catalog, Resource schema) throws IOException {
        List<String> types = new ArrayList<>(catalog.ids());
        types.addFirst("");
        return schema.getContentAsString(StandardCharsets.UTF_8)
                .replace("\"{documentTypes}\"", json.writeValueAsString(types))
                .replace("\"{termKeys}\"", json.writeValueAsString(catalog.termKeys()));
    }

    /** Maps chat turns to Gemini contents; Gemini names the assistant role "model". */
    static List<Content> toContents(List<ChatMessage> messages) {
        return messages.stream()
                .map(message -> Content.builder()
                        .role(message.role().equals("user") ? "user" : "model")
                        .parts(Part.fromText(message.text()))
                        .build())
                .toList();
    }
}
