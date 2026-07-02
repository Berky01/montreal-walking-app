import { getIssueReports, getPlaces, getRoutes } from "@/lib/data/index";
import { summarizeContentReadiness, validateDataCatalog } from "@/lib/data/validators";

export function GET() {
  const routes = getRoutes();
  const places = getPlaces();
  const validation = validateDataCatalog({ routes, places });

  return Response.json({
    validation,
    readiness: summarizeContentReadiness({ routes, places }),
    issueReports: getIssueReports()
  });
}
