import type { Metadata } from "next";
import { DocumentCreator } from "@/components/DocumentCreator";

export const metadata: Metadata = {
  title: "Draft a document | Prelegal",
};

export default function AppPage() {
  return <DocumentCreator />;
}
