import { createIssueReport, getPlaces, getRoutes } from "@/lib/data/index";
import type { IssueReportInput } from "@/lib/data/types";
import { validateIssueReportInput } from "@/lib/issue-reports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMaxReports = 8;
const reportAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as (Partial<IssueReportInput> & { website?: string }) | null;

  if (body?.website) {
    return Response.json({ ok: true }, { status: 202 });
  }

  if (isRateLimited(request)) {
    return Response.json({ error: "Too many reports. Please wait before submitting another report." }, { status: 429 });
  }

  const validation = validateIssueReportInput(body);

  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const contextValidationError = validatePublicContext(validation.data);
  if (contextValidationError) {
    return Response.json({ error: contextValidationError }, { status: 400 });
  }

  const report = createIssueReport(validation.data);

  return Response.json({ report }, { status: 201 });
}

function validatePublicContext(input: IssueReportInput): string | null {
  const routes = getRoutes();
  const places = getPlaces();
  const route = input.routeSlug ? routes.find((item) => item.slug === input.routeSlug) : undefined;
  const place = input.placeSlug ? places.find((item) => item.slug === input.placeSlug) : undefined;

  if (input.routeSlug && !route) {
    return "valid published route context is required";
  }

  if (input.placeSlug && !place) {
    return "valid published place context is required";
  }

  if (input.stopId) {
    if (!route) {
      return "route context is required for stop reports";
    }

    const stop = route.stops.find((item) => item.id === input.stopId);
    if (!stop) {
      return "valid published stop context is required";
    }

    if (place && stop.placeId !== place.id) {
      return "place context must match the selected stop";
    }
  }

  return null;
}

function isRateLimited(request: Request): boolean {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwardedFor || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const current = reportAttempts.get(key);

  if (!current || current.resetAt <= now) {
    reportAttempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }

  current.count += 1;
  return current.count > rateLimitMaxReports;
}
