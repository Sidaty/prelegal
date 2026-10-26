package com.prelegal.chat;

import java.util.List;

/**
 * A legal document being drafted; mirrors {@code Document} in frontend/src/lib/documents.ts.
 * {@code type} is a document id from documents.json, or empty until chosen.
 */
public record Document(String type, Party party1, Party party2, List<Term> terms) {

    /** One signing party. */
    public record Party(String name, String title, String company, String noticeAddress) {
    }

    /** The value of one key term, identified by its key in documents.json. */
    public record Term(String key, String value) {
    }
}
