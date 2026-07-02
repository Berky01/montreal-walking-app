import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full min-w-0 max-w-7xl px-page-mobile md:px-page-desktop", className)} {...props} />;
}
