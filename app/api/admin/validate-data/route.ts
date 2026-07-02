import { getPlaces, getRoutes } from "@/lib/data/index";
import { validateDataCatalog } from "@/lib/data/validators";

export function POST() {
  const routes = getRoutes();
  const places = getPlaces();

  return Response.json({
    validation: validateDataCatalog({ routes, places })
  });
}
