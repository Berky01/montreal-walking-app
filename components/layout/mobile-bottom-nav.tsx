"use client";

import Link from "next/link";
import { Bookmark, Building2, Home, MapPinned, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/app", label: "Explore", icon: Home },
  { href: "/places", label: "Places", icon: MapPinned },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cities", label: "Cities", icon: Building2 },
  { href: "/saved", label: "Saved", icon: Bookmark }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-floating md:hidden" aria-label="Mobile navigation">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-control text-[10px] font-semibold sm:text-[11px]",
                active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
