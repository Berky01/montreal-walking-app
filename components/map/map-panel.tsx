import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function MapPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={cn("rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card", className)}>{children}</aside>;
}
