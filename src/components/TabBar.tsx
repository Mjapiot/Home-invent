"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Plus, Bell } from "lucide-react";

const TABS = [
  { href: "/homes", label: "Maisons", Icon: House },
  { href: "/search", label: "Recherche", Icon: Search },
  { href: "/capture", label: "Ajouter", Icon: Plus, primary: true },
  { href: "/alerts", label: "Alertes", Icon: Bell },
] as const;

export default function TabBar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");

          if ("primary" in tab && tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="flex h-13 w-13 -translate-y-3 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40"
              >
                <tab.Icon size={26} strokeWidth={2.4} />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <span
                className={`flex h-10 w-12 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-accent-soft text-accent" : "text-muted"
                }`}
              >
                <tab.Icon size={22} strokeWidth={active ? 2.4 : 2} />
              </span>
              {tab.href === "/alerts" && alertCount > 0 && (
                <span className="absolute right-2 top-0 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
