"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadDocumentAction, type UploadDocumentState } from "@/app/(app)/document-actions";
import type { DocumentScope, TrustLevel } from "@/lib/types";

const TRUST_LEVELS: TrustLevel[] = ["unverified", "verified", "official"];

const fieldClassName =
  "rounded-sm border border-rule-gray bg-white px-3 py-2 font-serif text-sm text-ink outline-none focus-visible:border-survey-blue focus-visible:ring-2 focus-visible:ring-survey-blue";
const labelClassName = "font-sans text-xs font-medium tracking-wide text-ink/70 uppercase";

export function DocumentUploadForm({
  scope,
  jurisdictionId,
  projectId,
  revalidateTarget,
  docTypePlaceholder = "e.g. official_code, internal_note, client_submission",
}: {
  scope: DocumentScope;
  jurisdictionId?: string;
  projectId?: string;
  revalidateTarget: string;
  docTypePlaceholder?: string;
}) {
  const [state, action, pending] = useActionState<UploadDocumentState | undefined, FormData>(uploadDocumentAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldId = (name: string) => `${scope}-${projectId ?? "x"}-${name}`;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-md border border-rule-gray bg-white/40 p-4">
      <input type="hidden" name="scope" value={scope} />
      {jurisdictionId ? <input type="hidden" name="jurisdictionId" value={jurisdictionId} /> : null}
      {projectId ? <input type="hidden" name="projectId" value={projectId} /> : null}
      <input type="hidden" name="revalidateTarget" value={revalidateTarget} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId("file")} className={labelClassName}>
          File
        </label>
        <input id={fieldId("file")} name="file" type="file" required className={`${fieldClassName} font-sans`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId("docType")} className={labelClassName}>
            Document type
          </label>
          <input id={fieldId("docType")} name="docType" required placeholder={docTypePlaceholder} className={fieldClassName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId("trustLevel")} className={labelClassName}>
            Trust level
          </label>
          <select id={fieldId("trustLevel")} name="trustLevel" defaultValue="unverified" className={fieldClassName}>
            {TRUST_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error ? (
        <p role="alert" className="font-sans text-sm text-flag-orange">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-sm bg-survey-blue px-4 py-2 font-sans text-sm font-medium text-vellum transition-colors hover:bg-survey-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload document"}
      </button>
    </form>
  );
}
