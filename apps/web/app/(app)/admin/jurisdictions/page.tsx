import { redirect } from "next/navigation";
import { JurisdictionCreateForm } from "@/components/admin/jurisdiction-create-form";
import { JurisdictionList } from "@/components/admin/jurisdiction-list";
import { listJurisdictions } from "@/lib/api";
import { getAccessToken, getSession } from "@/lib/session";

export default async function AdminJurisdictionsPage() {
  const [session, token] = await Promise.all([getSession(), getAccessToken()]);
  if (!session || !token) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    return (
      <div className="flex-1 px-6 py-8 md:px-10">
        <p className="font-serif text-sm text-ink/60">Only an organization admin can manage jurisdictions.</p>
      </div>
    );
  }

  const jurisdictions = await listJurisdictions(token);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      <h1 className="font-sans text-2xl font-semibold text-ink md:text-3xl">Jurisdictions</h1>
      <p className="mt-1 max-w-2xl font-serif text-sm text-ink/60">
        Every county Landplanr recognizes. Creating one here only registers it — it starts empty and isn&rsquo;t useful for
        chat until a consultant uploads documents to it.
      </p>

      <section className="mt-8 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">New jurisdiction</h2>
        <div className="mt-4">
          <JurisdictionCreateForm />
        </div>
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-sans text-lg font-semibold text-ink">Existing jurisdictions</h2>
        <div className="mt-4">
          <JurisdictionList jurisdictions={jurisdictions} />
        </div>
      </section>
    </div>
  );
}
