"use client";

import { useActionState, useEffect } from "react";
import { createProjectAction, type CreateProjectState } from "@/app/(app)/dashboard/actions";
import type { Jurisdiction } from "@/lib/types";

const fieldClassName =
  "rounded-sm border border-rule-gray bg-white px-3 py-2 font-serif text-sm text-ink outline-none focus-visible:border-survey-blue focus-visible:ring-2 focus-visible:ring-survey-blue";
const labelClassName = "font-sans text-xs font-medium tracking-wide text-ink/70 uppercase";

export function NewProjectDialog({ jurisdictions, onClose }: { jurisdictions: Jurisdiction[]; onClose: () => void }) {
  const [state, action, pending] = useActionState<CreateProjectState | undefined, FormData>(createProjectAction, undefined);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        className="w-full max-w-md rounded-md border border-rule-gray bg-vellum p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="new-project-title" className="font-sans text-lg font-semibold text-ink">
          New project
        </h2>

        <form action={action} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className={labelClassName}>
              Project name
            </label>
            <input id="name" name="name" required autoFocus className={fieldClassName} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="jurisdictionId" className={labelClassName}>
              Jurisdiction
            </label>
            <select
              id="jurisdictionId"
              name="jurisdictionId"
              required
              defaultValue={jurisdictions[0]?.id ?? ""}
              className={fieldClassName}
            >
              {jurisdictions.map((jurisdiction) => (
                <option key={jurisdiction.id} value={jurisdiction.id}>
                  {jurisdiction.name}, {jurisdiction.state}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="address" className={labelClassName}>
              Address <span className="normal-case text-ink/40">(optional)</span>
            </label>
            <input id="address" name="address" className={fieldClassName} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="projectType" className={labelClassName}>
              Project type <span className="normal-case text-ink/40">(optional)</span>
            </label>
            <input id="projectType" name="projectType" placeholder="e.g. short_plat, adu, new_sfr" className={fieldClassName} />
          </div>

          {state?.error ? (
            <p role="alert" className="font-sans text-sm text-flag-orange">
              {state.error}
            </p>
          ) : null}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-rule-gray px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:bg-rule-gray/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-survey-blue px-4 py-2 font-sans text-sm font-medium text-vellum transition-colors hover:bg-survey-blue/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-survey-blue disabled:opacity-60"
            >
              {pending ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
