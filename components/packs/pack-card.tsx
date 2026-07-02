import { Lock } from "lucide-react";
import type { CityPack } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function PackCard({ pack }: { pack: CityPack }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-primary">
        <Lock aria-hidden="true" size={17} />
        <p className="text-label-sm">Feature-flagged pack</p>
      </div>
      <h3 className="mt-2 text-body-lg font-semibold text-on-surface">{pack.title}</h3>
      <p className="mt-2 text-body-md text-on-surface-variant">{pack.summary}</p>
      <p className="mt-4 text-label-sm text-on-surface-variant">{pack.routeSlugs.length} routes prepared</p>
    </Card>
  );
}
