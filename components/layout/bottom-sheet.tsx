import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function BottomSheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-t-card border-t border-outline-variant bg-surface-container-lowest p-4 shadow-floating md:rounded-card md:border", className)}>
      {children}
    </section>
  );
}
