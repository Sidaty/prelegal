package com.prelegal.chat;

import java.util.List;

/** The whole conversation so far and the current document. */
public record ChatRequest(List<ChatMessage> messages, Document document) {
}
