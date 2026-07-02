import { Card } from "./card";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <Card aria-busy="true" aria-live="polite" className="p-6" role="status">
      <p className="text-label-md text-on-surface">{label}</p>
      <div className="mt-4 grid gap-3">
        <span className="h-3 rounded-full bg-surface-container-high" />
        <span className="h-3 w-2/3 rounded-full bg-surface-container-high" />
      </div>
    </Card>
  );
}
