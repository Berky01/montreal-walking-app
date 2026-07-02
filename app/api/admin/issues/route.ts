import { getIssueReports } from "@/lib/data/index";

export function GET() {
  return Response.json({
    issueReports: getIssueReports()
  });
}
