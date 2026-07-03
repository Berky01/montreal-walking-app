import fs from "node:fs";
import path from "node:path";
import type { IssueReport, IssueReportTriageInput } from "@/lib/data/types";

const defaultStorePath = path.join(process.cwd(), "runtime", "issue-reports.json");
const maxReports = 2000;
const issueCategories = new Set([
  "closed",
  "construction",
  "safety",
  "accessibility",
  "incorrect_information",
  "place_info_wrong",
  "photo_source_issue",
  "opening_access_changed",
  "accessibility_detail_wrong",
  "construction_nearby",
  "duplicate_place",
  "suggest_place_nearby",
  "other"
]);

export function resolveIssueReportStorePath(): string {
  return process.env.ISSUE_REPORT_STORE_PATH?.trim() || defaultStorePath;
}

export function readIssueReportsFromStore(): IssueReport[] {
  const storePath = resolveIssueReportStorePath();

  if (!fs.existsSync(storePath)) {
    return [];
  }

  const raw = fs.readFileSync(storePath, "utf8").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Issue report store must contain an array: ${storePath}`);
  }

  return parsed.flatMap((item) => {
    const report = normalizeIssueReport(item);
    return report ? [report] : [];
  });
}

export function appendIssueReportToStore(report: IssueReport): IssueReport {
  const reports = readIssueReportsFromStore();
  writeIssueReportsToStore([report, ...reports.filter((item) => item.id !== report.id)].slice(0, maxReports));
  return report;
}

export function updateIssueReportInStore(input: IssueReportTriageInput): IssueReport | undefined {
  const reports = readIssueReportsFromStore();
  const index = reports.findIndex((report) => report.id === input.id);

  if (index === -1) {
    return undefined;
  }

  const updated: IssueReport = {
    ...reports[index],
    status: input.status,
    severity: input.severity,
    reviewer: input.reviewer,
    resolutionNotes: input.resolutionNotes,
    updatedAt: new Date().toISOString()
  };
  const next = [...reports];
  next[index] = updated;
  writeIssueReportsToStore(next);
  return updated;
}

function writeIssueReportsToStore(reports: IssueReport[]): void {
  const storePath = resolveIssueReportStorePath();
  const directory = path.dirname(storePath);
  fs.mkdirSync(directory, { recursive: true });

  const tempPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(reports, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tempPath, storePath);
}

function normalizeIssueReport(value: unknown): IssueReport | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const item = value as Partial<IssueReport>;
  if (
    typeof item.id !== "string" ||
    !isIssueCategory(item.category) ||
    typeof item.description !== "string" ||
    typeof item.createdAt !== "string" ||
    !isIssueStatus(item.status)
  ) {
    return undefined;
  }

  return {
    id: item.id,
    routeId: stringOrUndefined(item.routeId),
    routeSlug: stringOrUndefined(item.routeSlug),
    placeId: stringOrUndefined(item.placeId),
    placeSlug: stringOrUndefined(item.placeSlug),
    stopId: stringOrUndefined(item.stopId),
    category: item.category,
    severity: isIssueSeverity(item.severity) ? item.severity : undefined,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: stringOrUndefined(item.updatedAt),
    status: item.status,
    reviewer: stringOrUndefined(item.reviewer),
    resolutionNotes: stringOrUndefined(item.resolutionNotes)
  } as IssueReport;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isIssueStatus(value: unknown): value is IssueReport["status"] {
  return value === "new" || value === "reviewing" || value === "resolved" || value === "dismissed";
}

function isIssueSeverity(value: unknown): value is IssueReport["severity"] {
  return value === "low" || value === "medium" || value === "high";
}

function isIssueCategory(value: unknown): value is IssueReport["category"] {
  return typeof value === "string" && issueCategories.has(value);
}
