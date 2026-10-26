"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { GREETING, sendChat, type ChatMessage } from "@/lib/chat";
import type { NdaData } from "@/lib/nda";

interface NdaChatProps {
  data: NdaData;
  onChange: (data: NdaData) => void;
}

/** Freeform chat with the AI, which asks about the NDA and fills in its fields from the answers. */
export function NdaChat({ data, onChange }: NdaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    const conversation: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(conversation);
    setInput("");
    setError(null);
    setPending(true);
    try {
      const response = await sendChat(conversation, data);
      setMessages([...conversation, { role: "assistant", text: response.reply }]);
      onChange(response.nda);
    } catch (e) {
      console.error(e);
      // Give the message back so the user can resend it.
      setMessages(messages);
      setInput(text);
      setError("The assistant could not answer. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter also confirms IME composition (e.g. Japanese input); only send outside of it.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) send(event);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
      <ol ref={listRef} aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <li key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                message.role === "user" ? "bg-primary text-white" : "bg-stone-100 text-stone-900"
              }`}
            >
              {message.text}
            </p>
          </li>
        ))}
        {pending && (
          <li className="flex justify-start">
            <p className="rounded-2xl bg-stone-100 px-4 py-2 text-sm text-muted">Thinking…</p>
          </li>
        )}
      </ol>
      <form onSubmit={send} className="border-t border-stone-200 p-3">
        <p role="status" aria-live="polite" className="mb-2 text-sm text-red-600 empty:hidden">
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
            className="flex-1 resize-none rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="rounded-md bg-submit px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
