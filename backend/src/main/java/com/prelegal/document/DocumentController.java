package com.prelegal.document;

import com.prelegal.chat.ChatMessage;
import com.prelegal.chat.Document;
import com.prelegal.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** The signed-in user's document history: list, open, create and update their own documents. */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final SavedDocumentRepository documents;
    private final UserRepository users;
    private final JsonMapper json;

    public DocumentController(SavedDocumentRepository documents, UserRepository users, JsonMapper json) {
        this.documents = documents;
        this.users = users;
        this.json = json;
    }

    /** What the frontend saves: a title, the drafted document and the conversation that produced it. */
    public record Draft(
            @NotBlank @Size(max = 255) String title, @NotNull Document document, @NotNull List<ChatMessage> messages) {
    }

    /** A history entry. */
    public record Summary(Long id, String title, String type, Instant updatedAt) {
    }

    /** A saved document, ready to reopen. */
    public record Detail(Long id, String title, Document document, List<ChatMessage> messages, Instant updatedAt) {
    }

    /** Stored in {@link SavedDocument#getContent()}. */
    record Content(Document document, List<ChatMessage> messages) {
    }

    @GetMapping
    public List<Summary> list(Principal principal) {
        return documents.findByOwnerEmailOrderByUpdatedAtDesc(principal.getName()).stream()
                .map(saved -> new Summary(saved.getId(), saved.getTitle(), saved.getType(), saved.getUpdatedAt()))
                .toList();
    }

    @GetMapping("/{id}")
    public Detail get(@PathVariable Long id, Principal principal) {
        return detail(owned(id, principal));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Detail create(@Valid @RequestBody Draft draft, Principal principal) {
        var owner = users.findByEmail(principal.getName()).orElseThrow();
        return detail(documents.save(new SavedDocument(owner, draft.document().type(), draft.title(), contentJson(draft))));
    }

    @PutMapping("/{id}")
    @Transactional
    public Detail update(@PathVariable Long id, @Valid @RequestBody Draft draft, Principal principal) {
        SavedDocument saved = owned(id, principal);
        saved.update(draft.document().type(), draft.title(), contentJson(draft));
        return detail(saved);
    }

    /** The document, if it belongs to the user; another user's document is reported as not found. */
    private SavedDocument owned(Long id, Principal principal) {
        return documents.findByIdAndOwnerEmail(id, principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private Detail detail(SavedDocument saved) {
        Content content = content(saved);
        return new Detail(saved.getId(), saved.getTitle(), content.document(), content.messages(), saved.getUpdatedAt());
    }

    private Content content(SavedDocument saved) {
        return json.readValue(saved.getContent(), Content.class);
    }

    private String contentJson(Draft draft) {
        return json.writeValueAsString(new Content(draft.document(), draft.messages()));
    }
}
