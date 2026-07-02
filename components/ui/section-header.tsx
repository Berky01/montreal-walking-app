import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-label-sm uppercase tracking-[0.08em] text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 text-headline-mobile text-on-surface md:text-headline-lg">{title}</h2>
      </div>
      {action}
    </div>
  );
}
