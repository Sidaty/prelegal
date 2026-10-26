package com.prelegal.chat;

/** One chat turn; {@code role} is "user" or "assistant". */
public record ChatMessage(String role, String text) {
}
