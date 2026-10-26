import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GREETING } from "@/lib/chat";
import { DEFAULT_NDA } from "@/lib/nda";
import { NdaChat } from "./NdaChat";

describe("NdaChat", () => {
  const html = renderToStaticMarkup(<NdaChat data={DEFAULT_NDA} onChange={() => {}} />);

  it("opens with the assistant's greeting", () => {
    expect(html).toContain(renderToStaticMarkup(<>{GREETING.text}</>));
  });

  it("disables sending until the user types a message", () => {
    expect(html).toMatch(/<textarea[^>]*aria-label="Your message"/);
    expect(html).toMatch(/<button type="submit" disabled=""[^>]*>Send<\/button>/);
  });
});
