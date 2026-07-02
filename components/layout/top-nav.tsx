import Link from "next/link";
import { Map, Settings } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const navItems = [
  { href: "/app", label: "Explore" },
  { href: "/places", label: "Places" },
  { href: "/search", label: "Search" },
  { href: "/cities", label: "Cities" },
  { href: "/routes", label: "Optional routes" },
  { href: "/saved", label: "Saved" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-page-mobile md:px-page-desktop" aria-label="Primary navigation">
        <Link className="flex items-center gap-2 text-label-md font-bold text-primary" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-on-primary">
            <Map aria-hidden="true" size={18} />
          </span>
          <span>Meaningful Routes</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link className="rounded-control px-3 py-2 text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <ButtonLink className="hidden lg:inline-flex" href="/settings" size="sm" variant="secondary">
          <Settings aria-hidden="true" size={16} />
          Discovery preferences
        </ButtonLink>
      </nav>
    </header>
  );
}
