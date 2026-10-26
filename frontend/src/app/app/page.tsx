import type { Metadata } from "next";
import { DocumentList } from "@/components/DocumentList";

export const metadata: Metadata = {
  title: "Your documents | Prelegal",
};

export default function DocumentsPage() {
  return <DocumentList />;
}
