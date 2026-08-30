"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApiError, createProject } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

export interface CreateProjectState {
  error?: string;
}

export async function createProjectAction(
  _prevState: CreateProjectState | undefined,
  formData: FormData,
): Promise<CreateProjectState> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const jurisdictionId = String(formData.get("jurisdictionId") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const projectType = String(formData.get("projectType") ?? "").trim();

  if (!name) {
    return { error: "Project name is required." };
  }
  if (!jurisdictionId) {
    return { error: "Jurisdiction is required." };
  }

  let project;
  try {
    project = await createProject(token, {
      name,
      jurisdictionId,
      address: address || undefined,
      projectType: projectType || undefined,
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Failed to create project." };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/${project.id}`);
}
