package com.prelegal.chat;

/** The assistant's reply and the full, updated document. Also the model's structured output. */
public record ChatResponse(String reply, Document document) {
}
