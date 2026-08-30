import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TopBar } from "@/components/app-shell/top-bar";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-vellum text-ink">
      <TopBar email={session.email} role={session.role} />
      {children}
    </div>
  );
}
