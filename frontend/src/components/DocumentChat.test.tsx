import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GREETING } from "@/lib/chat";
import { EMPTY_DRAFT } from "@/lib/documents";
import { DocumentChat } from "./DocumentChat";

describe("DocumentChat", () => {
  const html = renderToStaticMarkup(<DocumentChat draft={EMPTY_DRAFT} onChange={() => {}} />);

  it("opens with the assistant's greeting", () => {
    expect(html).toContain(renderToStaticMarkup(<>{GREETING.text}</>));
  });

  it("disables sending until the user types a message", () => {
    expect(html).toMatch(/<textarea[^>]*aria-label="Your message"/);
    expect(html).toMatch(/<button type="submit" disabled=""[^>]*>Send<\/button>/);
  });
});
