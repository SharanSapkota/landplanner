"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Projects" },
  { href: "/library", label: "County Library" },
  { href: "/knowledge", label: "Firm Knowledge" },
];

const ADMIN_LINKS = [{ href: "/admin/jurisdictions", label: "Jurisdictions" }];

export function TopNav({ role }: { role: string }) {
  const pathname = usePathname();
  const links = role === "admin" ? [...LINKS, ...ADMIN_LINKS] : LINKS;

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-sm px-3 py-1.5 font-sans text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vellum ${
              active ? "bg-vellum/15 text-vellum" : "text-vellum/70 hover:bg-vellum/10 hover:text-vellum"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
