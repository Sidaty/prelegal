package com.prelegal.chat;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** The supported document types and their key terms, read from documents.json at the repository root. */
@Component
public class DocumentCatalog {

    private final List<Definition> documents;

    public DocumentCatalog(JsonMapper json, @Value("classpath:documents.json") Resource file) throws IOException {
        this.documents = json.readValue(file.getInputStream(), Catalog.class).documents();
    }

    public List<String> ids() {
        return documents.stream().map(Definition::id).toList();
    }

    /** Every term key, across all documents, without duplicates. */
    public List<String> termKeys() {
        return documents.stream().flatMap(d -> d.terms().stream()).map(TermDefinition::key).distinct().toList();
    }

    /** Lists each document with its parties and terms, for the AI's system prompt. */
    public String describe() {
        return documents.stream().map(DocumentCatalog::describe).collect(Collectors.joining("\n\n"));
    }

    private static String describe(Definition document) {
        String terms = document.terms().stream()
                .map(t -> "  - " + t.key() + " (" + t.label() + "): " + t.description())
                .collect(Collectors.joining("\n"));
        return "- " + document.id() + ": " + document.name() + ". " + document.description() + "\n"
                + "  party1 is the " + document.parties().get(0) + ", party2 is the " + document.parties().get(1) + ".\n"
                + "  Terms:\n" + terms;
    }

    record Catalog(List<Definition> documents) {
    }

    record Definition(String id, String name, String description, List<String> parties, List<TermDefinition> terms) {
    }

    record TermDefinition(String key, String label, String description) {
    }
}
