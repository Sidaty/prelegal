import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { marked } from "marked";
import { describe, expect, it } from "vitest";
import { DEFAULT_NDA, fillCoverPage, formatStandardTerms } from "@/lib/nda";
import { NdaPdfDocument } from "./NdaPdfDocument";

const templatesDir = join(__dirname, "../../../templates");

describe("NdaPdfDocument", () => {
  it("renders the filled NDA to a PDF", async () => {
    const data = {
      ...DEFAULT_NDA,
      effectiveDate: "2026-10-26",
      governingLaw: "Delaware",
      party1: { name: "Ada Lovelace", title: "CEO", company: "Acme Inc.", noticeAddress: "ada@acme.com" },
    };
    const coverPage = marked.lexer(fillCoverPage(readFileSync(join(templatesDir, "Mutual-NDA-coverpage.md"), "utf8"), data));
    const standardTerms = marked.lexer(formatStandardTerms(readFileSync(join(templatesDir, "Mutual-NDA.md"), "utf8")));

    const buffer = await renderToBuffer(<NdaPdfDocument coverPage={coverPage} standardTerms={standardTerms} />);

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    if (process.env.NDA_PDF_OUT) writeFileSync(process.env.NDA_PDF_OUT, buffer);
  });
});
