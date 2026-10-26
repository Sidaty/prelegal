import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT } from "./documents";
import { documentTitle, editedLabel } from "./history";

describe("documentTitle", () => {
  const csa = { ...EMPTY_DRAFT, type: "cloud-service-agreement" };
  const party = (company: string) => ({ ...EMPTY_DRAFT.party1, company });

  it("names the document and its parties", () => {
    expect(documentTitle({ ...csa, party1: party("Acme Inc."), party2: party("Globex Corp.") })).toBe(
      "Cloud Service Agreement between Acme Inc. and Globex Corp.",
    );
    expect(documentTitle({ ...csa, party2: party(" Globex Corp. ") })).toBe("Cloud Service Agreement with Globex Corp.");
    expect(documentTitle(csa)).toBe("Cloud Service Agreement");
  });
});

describe("editedLabel", () => {
  const now = Date.parse("2026-10-26T12:00:00Z");

  it("says how long ago the document was edited", () => {
    expect(editedLabel("2026-10-26T11:59:30Z", now)).toBe("Edited just now");
    expect(editedLabel("2026-10-26T11:55:00Z", now)).toBe("Edited 5 minutes ago");
    expect(editedLabel("2026-10-26T09:00:00Z", now)).toBe("Edited 3 hours ago");
    expect(editedLabel("2026-10-25T12:00:00Z", now)).toBe("Edited yesterday");
  });
});
