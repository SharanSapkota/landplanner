"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, createJurisdiction } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export interface CreateJurisdictionState {
  error?: string;
  success?: boolean;
}

// The backend independently enforces admin-only (@Roles('admin')) — this
// action doesn't duplicate that check, it just surfaces the 403 the API
// already returns if somehow reached by a non-admin (the nav link and page
// are both hidden from non-admins, but the route itself isn't a secret).
export async function createJurisdictionAction(
  _prevState: CreateJurisdictionState | undefined,
  formData: FormData,
): Promise<CreateJurisdictionState> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !state || !slug) {
    return { error: "Name, state, and slug are all required." };
  }

  try {
    await createJurisdiction(token, { name, state, slug });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Failed to create jurisdiction." };
  }

  revalidatePath("/admin/jurisdictions");
  return { success: true };
}
