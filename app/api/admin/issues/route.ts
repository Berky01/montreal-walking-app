import { requireAdminToolsResponse, requireAdminWriteActionsResponse } from "@/lib/admin/access";
import { getIssueReports, updateIssueReport } from "@/lib/data/index";
import { validateIssueReportTriageInput } from "@/lib/issue-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const adminError = requireAdminToolsResponse();
  if (adminError) {
    return adminError;
  }

  return Response.json({
    issueReports: getIssueReports()
  });
}

export async function POST(request: Request) {
  const adminError = requireAdminWriteActionsResponse();
  if (adminError) {
    return adminError;
  }

  const { body, formPost } = await readUpdateBody(request);
  const validation = validateIssueReportTriageInput(body);

  if (!validation.ok) {
    return respond(request, formPost, { error: validation.error }, 400);
  }

  const report = updateIssueReport(validation.data);
  if (!report) {
    return respond(request, formPost, { error: "issue report not found" }, 404);
  }

  return respond(request, formPost, { issueReport: report }, 200);
}

async function readUpdateBody(request: Request): Promise<{ body: Record<string, unknown>; formPost: boolean }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return { body, formPost: false };
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return { body: {}, formPost: false };
  }

  return { body: Object.fromEntries(formData), formPost: true };
}

function respond(request: Request, formPost: boolean, body: Record<string, unknown>, status: number): Response {
  if (formPost && status < 400) {
    return Response.redirect(new URL("/admin/issues?updated=1", request.url), 303);
  }

  if (formPost) {
    return Response.redirect(new URL(`/admin/issues?error=${encodeURIComponent(String(body.error ?? "update failed"))}`, request.url), 303);
  }

  return Response.json(body, { status });
}
