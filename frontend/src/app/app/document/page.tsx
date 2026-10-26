import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentCreator } from "@/components/DocumentCreator";

export const metadata: Metadata = {
  title: "Draft a document | Prelegal",
};

/** A new document, or the saved one given by `?id=`. */
export default function DocumentPage() {
  return (
    <Suspense>
      <DocumentCreator />
    </Suspense>
  );
}
