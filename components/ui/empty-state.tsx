import type { ReactNode } from "react";
import { Card } from "./card";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-6 text-center" role="status">
      <h3 className="text-body-lg font-semibold text-on-surface">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
