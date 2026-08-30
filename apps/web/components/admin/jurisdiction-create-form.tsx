"use client";

import { useActionState, useEffect, useRef } from "react";
import { createJurisdictionAction, type CreateJurisdictionState } from "@/app/(app)/admin/jurisdictions/actions";

const fieldClassName =
  "rounded-sm border border-rule-gray bg-white px-3 py-2 font-serif text-sm text-ink outline-none focus-visible:border-survey-blue focus-visible:ring-2 focus-visible:ring-survey-blue";
const labelClassName = "font-sans text-xs font-medium tracking-wide text-ink/70 uppercase";

export function JurisdictionCreateForm() {
  const [state, action, pending] = useActionState<CreateJurisdictionState | undefined, FormData>(createJurisdictionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-md border border-rule-gray bg-white/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="jurisdiction-name" className={labelClassName}>
            County name
          </label>
          <input id="jurisdiction-name" name="name" required placeholder="Pierce County" className={fieldClassName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="jurisdiction-state" className={labelClassName}>
            State
          </label>
          <input id="jurisdiction-state" name="state" required placeholder="WA" className={fieldClassName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="jurisdiction-slug" className={labelClassName}>
            Slug
          </label>
          <input
            id="jurisdiction-slug"
            name="slug"
            required
            placeholder="pierce-county-wa"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={`${fieldClassName} font-mono`}
          />
        </div>
      </div>

      <p className="font-serif text-xs text-ink/50">
        Lowercase letters, numbers, and hyphens only — e.g. &ldquo;pierce-county-wa&rdquo;. A new jurisdiction starts empty; it
        isn&rsquo;t useful until documents are uploaded to it.
      </p>

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
        {pending ? "Creating…" : "Create jurisdiction"}
      </button>
    </form>
  );
}
