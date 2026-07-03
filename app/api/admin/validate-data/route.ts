import { requireAdminToolsResponse } from "@/lib/admin/access";
import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

export const dynamic = "force-dynamic";

export function POST() {
  const adminError = requireAdminToolsResponse();
  if (adminError) {
    return adminError;
  }

  const routes = getAllRoutes();
  const places = getAllPlaces();

  return Response.json({
    publicReadiness: validatePublicContentReadiness({ routes, places }),
    validation: validateDataCatalog({ routes, places })
  });
}
