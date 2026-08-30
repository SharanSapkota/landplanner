"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Document } from "@/lib/types";

// Ingestion runs in the background (BullMQ) — while any document here is
// still pending/processing, poll the server data every few seconds so the
// status badge actually updates without a manual reload. Stops on its own
// once nothing is left in a non-terminal state.
export function PendingRefresher({ documents }: { documents: Document[] }) {
  const router = useRouter();
  const hasPending = documents.some((doc) => doc.processingStatus === "pending" || doc.processingStatus === "processing");

  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [hasPending, router]);

  return null;
}
