package com.prelegal.document;

import com.prelegal.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/** A document a user drafted, with its chat conversation, stored as JSON in {@code content}. */
@Entity
@Table(name = "documents")
public class SavedDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User owner;

    /** Document id from documents.json, kept outside the JSON content to list documents cheaply. */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = createdAt;

    protected SavedDocument() {
    }

    public SavedDocument(User owner, String type, String title, String content) {
        this.owner = owner;
        this.type = type;
        this.title = title;
        this.content = content;
    }

    public void update(String type, String title, String content) {
        this.type = type;
        this.title = title;
        this.content = content;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
