import type { ReactNode } from "react";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { TopNav } from "./top-nav";

export function AppShell({ children, showMobileNav = true }: { children: ReactNode; showMobileNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav />
      {children}
      {showMobileNav ? <MobileBottomNav /> : null}
    </div>
  );
}
