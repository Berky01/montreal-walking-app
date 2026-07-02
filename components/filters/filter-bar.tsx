import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FilterBar({ children, className, label = "Filters" }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cn("rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card", className)}>
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </section>
  );
}
