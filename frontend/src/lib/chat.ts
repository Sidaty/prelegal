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
export async function sendChat(messages: ChatMessage[], draft: LegalDocument): Promise<{ reply: string; document: LegalDocument }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, document: draft }),
  });
  if (!response.ok) throw new Error(`Chat request failed with status ${response.status}`);
  return response.json();
}
