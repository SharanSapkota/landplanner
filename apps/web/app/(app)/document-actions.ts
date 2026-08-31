"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, uploadDocument } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import type { DocumentScope, TrustLevel } from "@/lib/types";

export interface UploadDocumentState {
  error?: string;
  success?: boolean;
}

// One shared action for all three upload contexts (project detail, County
// Library, Firm Knowledge) — scope/jurisdictionId/projectId travel as
// hidden fields set by each screen's <DocumentUploadForm>, and
// revalidateTarget tells this action which page's document list to refresh
// (there's no other way for one shared action to know which caller invoked
// it, since it doesn't redirect anywhere on success).
export async function uploadDocumentAction(
  _prevState: UploadDocumentState | undefined,
  formData: FormData,
): Promise<UploadDocumentState> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const scope = String(formData.get("scope") ?? "") as DocumentScope;
  const docType = String(formData.get("docType") ?? "").trim();
  const jurisdictionId = String(formData.get("jurisdictionId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const trustLevel = String(formData.get("trustLevel") ?? "").trim();
  const revalidateTarget = String(formData.get("revalidateTarget") ?? "").trim();

  if (!docType) {
    return { error: "Document type is required." };
  }

  try {
    await uploadDocument(token, {
      file,
      scope,
      docType,
      jurisdictionId: jurisdictionId || undefined,
      projectId: projectId || undefined,
      trustLevel: (trustLevel || undefined) as TrustLevel | undefined,
    });
  } catch (error) {
    // Previously swallowed silently — the client only ever saw a generic
    // message, with nothing in the server log to diagnose a real failure
    // from. No secrets in scope here (file name/scope/docType only), so
    // logging the raw error is safe.
    console.error("[uploadDocumentAction] upload failed", { scope, jurisdictionId, projectId, error });
    return { error: error instanceof ApiError ? error.message : "Failed to upload document." };
  }

  if (revalidateTarget) {
    revalidatePath(revalidateTarget);
  }

  return { success: true };
}
