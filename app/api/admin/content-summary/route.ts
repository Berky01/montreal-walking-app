import { requireAdminToolsResponse } from "@/lib/admin/access";
import { getAllPlaces, getAllRoutes, getIssueReports } from "@/lib/data/index";
import { summarizeContentReadiness, validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const adminError = requireAdminToolsResponse();
  if (adminError) {
    return adminError;
  }

  const routes = getAllRoutes();
  const places = getAllPlaces();
  const validation = validateDataCatalog({ routes, places });

  return Response.json({
    publicReadiness: validatePublicContentReadiness({ routes, places }),
    validation,
    readiness: summarizeContentReadiness({ routes, places }),
    issueReports: getIssueReports()
  });
}
