import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked, type Token } from "marked";

/** Reads a file of the repository's templates directory. */
export function readTemplate(fileName: string): string {
  return readFileSync(join(__dirname, "../../../templates", fileName), "utf8");
}

/** Text as rendered from the markdown, one line per block / list item / table row. */
export function renderedText(md: string): string {
  const inline = (tokens: Token[] = []): string =>
    tokens
      .map((t) => {
        if (t.type === "checkbox") return t.checked ? "[x] " : "[ ] ";
        if (t.type === "br") return "\n";
        if (t.type === "html") return "";
        return "tokens" in t && t.tokens ? inline(t.tokens) : "text" in t ? t.text : "";
      })
      .join("");
  return marked
    .lexer(md)
    .flatMap((t): string[] => {
      if (t.type === "list") return t.items.map((item: { tokens: Token[] }) => inline(item.tokens));
      if (t.type === "table")
        return [t.header, ...t.rows].map((row: { tokens: Token[] }[]) => row.map((c) => inline(c.tokens)).join(" | "));
      return "tokens" in t ? [inline(t.tokens)] : [];
    })
    .join("\n");
}

