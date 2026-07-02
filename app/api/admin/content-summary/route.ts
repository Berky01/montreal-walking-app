import { getAllPlaces, getAllRoutes, getIssueReports } from "@/lib/data/index";
import { summarizeContentReadiness, validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

export function GET() {
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
