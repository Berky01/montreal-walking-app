import { RouteCard } from "@/components/routes/route-card";
import { getRoutes } from "@/lib/data/index";
import type { Place } from "@/lib/types";

export function RelatedRoutes({ place }: { place: Place }) {
  const routes = getRoutes();
  const related = routes.filter((route) => place.relatedRouteSlugs.includes(route.slug)).slice(0, 3);

  if (!related.length) {
    return null;
  }

  return (
    <section>
      <h2 className="text-headline-mobile text-on-surface">Ways to explore around this place</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {related.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </section>
  );
}
