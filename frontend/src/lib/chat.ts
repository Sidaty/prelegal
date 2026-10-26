import type { NdaData } from "./nda";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

/** Shown before the first exchange, without calling the AI. */
export const GREETING: ChatMessage = {
  role: "assistant",
  text: "Hi! I'll help you prepare a Mutual Non-Disclosure Agreement. To start, which two companies are entering into this NDA, and what is the purpose of sharing confidential information?",
};

/** Sends the conversation and current fields to the AI; resolves with its reply and the updated fields. */
export async function sendChat(messages: ChatMessage[], nda: NdaData): Promise<{ reply: string; nda: NdaData }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, nda }),
  });
  if (!response.ok) throw new Error(`Chat request failed with status ${response.status}`);
  return response.json();
}
