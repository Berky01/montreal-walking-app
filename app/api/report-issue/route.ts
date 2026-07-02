import { createIssueReport } from "@/lib/data/index";
import type { IssueReportInput } from "@/lib/data/types";
import { validateIssueReportInput } from "@/lib/issue-reports";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<IssueReportInput> | null;
  const validation = validateIssueReportInput(body);

  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const report = createIssueReport(validation.data);

  return Response.json({ report }, { status: 201 });
}
