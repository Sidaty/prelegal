import { api } from "./api";
import type { LegalDocument } from "./documents";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

/** Shown before the first exchange, without calling the AI. */
export const GREETING: ChatMessage = {
  role: "assistant",
  text: "Hi! I'll help you draft a legal agreement, such as an NDA, a cloud service agreement, a data processing agreement or a pilot agreement. What would you like to put in place, and with whom?",
};

/** Sends the conversation and current document to the AI; resolves with its reply and the updated document. */
export function sendChat(messages: ChatMessage[], draft: LegalDocument): Promise<{ reply: string; document: LegalDocument }> {
  return api("/api/chat", "POST", { messages, document: draft });
}
