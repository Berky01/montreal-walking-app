import type { ReactNode } from "react";
import { TopNav } from "./top-nav";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopNav />
      {children}
    </div>
  );
}
