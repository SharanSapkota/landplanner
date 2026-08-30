import { logout } from "@/app/login/actions";
import { TopNav } from "./top-nav";

export function TopBar({ email, role }: { email: string; role: string }) {
  return (
    <header className="flex flex-col gap-2 bg-survey-blue px-4 py-3 text-vellum md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-center justify-between gap-4">
        <span className="font-sans text-base font-semibold tracking-tight">Landplanr</span>
        <div className="flex items-center gap-3 md:hidden">
          <span className="font-sans text-xs tracking-wide text-vellum/70 uppercase">{role}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-sm border border-vellum/30 px-3 py-1.5 font-sans text-xs font-medium text-vellum transition-colors hover:bg-vellum/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellum"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:flex-1 md:justify-end">
        <TopNav role={role} />
        <div className="hidden items-center gap-4 md:flex">
          <span className="font-sans text-xs tracking-wide text-vellum/70 uppercase">
            {email} · {role}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-sm border border-vellum/30 px-3 py-1.5 font-sans text-xs font-medium text-vellum transition-colors hover:bg-vellum/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellum"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
