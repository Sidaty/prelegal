"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { sendChat, type ChatMessage } from "@/lib/chat";
import type { LegalDocument } from "@/lib/documents";

interface DocumentChatProps {
  draft: LegalDocument;
  messages: ChatMessage[];
  /** Called after each answer of the AI, with the whole conversation and the updated document. */
  onTurn: (messages: ChatMessage[], draft: LegalDocument) => void;
}

/** Freeform chat with the AI, which picks the document with the user and fills it in from the answers. */
export function DocumentChat({ draft, messages, onTurn }: DocumentChatProps) {
  const [input, setInput] = useState("");
  // The message being answered, shown until the AI replies.
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const conversation: ChatMessage[] = [...messages, { role: "user", text }];
    setInput("");
    setError(null);
    setSending(text);
    try {
      const response = await sendChat(conversation, draft);
      onTurn([...conversation, { role: "assistant", text: response.reply }], response.document);
    } catch (e) {
      console.error(e);
      // Give the message back so the user can resend it.
      setInput(text);
      setError("The assistant could not answer. Send your message again.");
    } finally {
      setSending(null);
    }
  }

  const shown: ChatMessage[] = sending === null ? messages : [...messages, { role: "user", text: sending }];

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter also confirms IME composition (e.g. Japanese input); only send outside of it.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border border-line bg-white lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-6rem)]">
      <ol ref={listRef} aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto p-4">
        {shown.map((message, index) => (
          <li key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === "user" ? "bg-primary text-white" : "bg-surface text-stone-900"
              }`}
            >
              {message.text}
            </p>
          </li>
        ))}
        {sending !== null && (
          <li className="flex justify-start">
            <p className="rounded-2xl bg-surface px-4 py-2 text-sm text-muted">Thinking…</p>
          </li>
        )}
      </ol>
      <form onSubmit={send} className="border-t border-line p-3">
        <p role="alert" className="mb-2 text-sm text-red-700 empty:hidden">
          {error}
        </p>
        <div className="flex items-end gap-2">
          <textarea
            aria-label="Your message"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            className="flex-1 resize-none rounded-md border border-line px-3 py-2 text-sm text-stone-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={sending !== null || !input.trim()}
            className="rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-submit/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
