import Link from "next/link";
import type { Neighborhood } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";

export function NeighborhoodCard({ neighborhood }: { neighborhood: Neighborhood }) {
  return (
    <Card className="p-5">
      <p className="text-label-sm text-primary">Montreal neighborhood</p>
      <h3 className="mt-2 text-body-lg font-semibold text-on-surface">{neighborhood.name}</h3>
      <p className="mt-2 text-body-md text-on-surface-variant">{neighborhood.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {neighborhood.tags.slice(0, 4).map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </div>
      <Link className="mt-4 inline-flex rounded-control text-label-md text-primary focus:outline-none focus:ring-2 focus:ring-primary" href={`/routes?neighborhood=${encodeURIComponent(neighborhood.name)}`}>
        View matching routes
      </Link>
    </Card>
  );
}
