import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NdaCreator } from "@/components/NdaCreator";

// The Common Paper templates live at the repository root; synchronous reads are prerendered at build time.
const templatesDir = join(process.cwd(), "..", "templates");

export default function Home() {
  const coverPageTemplate = readFileSync(join(templatesDir, "Mutual-NDA-coverpage.md"), "utf8");
  const standardTermsTemplate = readFileSync(join(templatesDir, "Mutual-NDA.md"), "utf8");
  return <NdaCreator coverPageTemplate={coverPageTemplate} standardTermsTemplate={standardTermsTemplate} />;
}
