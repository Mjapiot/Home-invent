"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/homes", label: "Maisons", icon: "🏠" },
  { href: "/search", label: "Recherche", icon: "🔍" },
  { href: "/capture", label: "Ajouter", icon: "➕" },
  { href: "/alerts", label: "Alertes", icon: "⏰" },
] as const;

export default function TabBar({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-safe">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={active ? "font-semibold" : ""}>{tab.label}</span>
              {tab.href === "/alerts" && alertCount > 0 && (
                <span className="absolute right-1/2 top-0.5 translate-x-4 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
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
