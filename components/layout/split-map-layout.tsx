import type { ReactNode } from "react";
import { BottomSheet } from "./bottom-sheet";

export function SplitMapLayout({ content, map }: { content: ReactNode; map: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
      <div className="min-w-0 space-y-5">
        <div className="lg:hidden">
          <BottomSheet className="p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-label-md text-on-surface">Discovery map</h2>
              <span className="text-label-sm text-on-surface-variant">Places nearby</span>
            </div>
            {map}
          </BottomSheet>
        </div>
        {content}
      </div>
      <aside className="hidden lg:block">{map}</aside>
    </div>
  );
}
