import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

export function POST() {
  const routes = getAllRoutes();
  const places = getAllPlaces();

  return Response.json({
    publicReadiness: validatePublicContentReadiness({ routes, places }),
    validation: validateDataCatalog({ routes, places })
  });
}
