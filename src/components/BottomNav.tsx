"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

const tabs = [
  {
    label: "Arena",
    href: "/",
    icon: (active: boolean) => (
      <img src="/red-ring-full.png" alt="" className={`h-5 w-5 object-contain rounded-full transition-opacity duration-200 ${active ? "opacity-100" : "opacity-40"}`} />
    ),
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { authenticated } = usePrivy();

  if (!authenticated) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 text-[12px] uppercase tracking-[0.15em] transition-colors duration-200 ${
                active
                  ? "text-red-600/80"
                  : "text-wolf-gray-600 hover:text-wolf-gray-400"
              }`}
            >
              {tab.icon(active)}
              <span className={active ? "font-semibold" : "font-medium"}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
