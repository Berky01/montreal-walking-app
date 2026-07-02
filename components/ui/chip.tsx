import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ChipTone = "primary" | "neutral" | "secondary" | "tertiary";

const toneClasses: Record<ChipTone, string> = {
  primary: "bg-primary/10 text-primary",
  neutral: "bg-surface-container text-on-surface-variant",
  secondary: "bg-secondary/10 text-secondary",
  tertiary: "bg-tertiary/10 text-tertiary"
};

export function Chip({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span className={cn("inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-label-sm", toneClasses[tone], className)} {...props} />
  );
}
