import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GREETING } from "@/lib/chat";
import { EMPTY_DRAFT } from "@/lib/documents";
import { DocumentChat } from "./DocumentChat";

const render = (messages = [GREETING]) =>
  renderToStaticMarkup(<DocumentChat draft={EMPTY_DRAFT} messages={messages} onTurn={() => {}} />);

describe("DocumentChat", () => {
  it("shows the conversation, starting with the assistant's greeting", () => {
    const html = render([GREETING, { role: "user", text: "We need an NDA with Globex" }]);

    expect(html).toContain(renderToStaticMarkup(<>{GREETING.text}</>));
    expect(html).toContain("We need an NDA with Globex");
  });

  it("disables sending until the user types a message", () => {
    const html = render();

    expect(html).toMatch(/<textarea[^>]*aria-label="Your message"/);
    expect(html).toMatch(/<button type="submit" disabled=""[^>]*>Send<\/button>/);
  });
});
