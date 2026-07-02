import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("sticky bottom-20 z-20 flex flex-wrap gap-2 rounded-card border border-outline-variant bg-surface-container-lowest p-3 shadow-floating md:bottom-4", className)}>
      {children}
    </div>
  );
}
