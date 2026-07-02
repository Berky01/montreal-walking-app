import type { ReactNode } from "react";
import { Card } from "./card";

export function ErrorState({ title = "Something went wrong", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <Card className="p-6" role="alert">
      <h3 className="text-body-lg font-semibold text-error">{title}</h3>
      <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
