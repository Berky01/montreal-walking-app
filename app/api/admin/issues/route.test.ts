import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appendIssueReportToStore } from "@/lib/data/issue-report-store";
import type { IssueReport } from "@/lib/types";
import { GET, POST } from "./route";

let tempDir = "";
let previousAdminTools: string | undefined;
let previousAdminWrites: string | undefined;
let previousStorePath: string | undefined;

beforeEach(() => {
  previousAdminTools = process.env.ENABLE_ADMIN_TOOLS;
  previousAdminWrites = process.env.ENABLE_ADMIN_WRITE_ACTIONS;
  previousStorePath = process.env.ISSUE_REPORT_STORE_PATH;
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "meaningful-routes-admin-issues-"));
  process.env.ISSUE_REPORT_STORE_PATH = path.join(tempDir, "issue-reports.json");
});

afterEach(() => {
  restoreEnv("ENABLE_ADMIN_TOOLS", previousAdminTools);
  restoreEnv("ENABLE_ADMIN_WRITE_ACTIONS", previousAdminWrites);
  restoreEnv("ISSUE_REPORT_STORE_PATH", previousStorePath);
  fs.rmSync(tempDir, { force: true, recursive: true });
});

describe("admin issue route", () => {
  it("hides the issue queue when admin tools are disabled", async () => {
    const response = GET();

    expect(response.status).toBe(404);
  });

  it("returns durable issue reports when admin tools are enabled", async () => {
    process.env.ENABLE_ADMIN_TOOLS = "true";
    appendIssueReportToStore(createReport("issue-admin-read"));

    const response = GET();
    const body = (await response.json()) as { issueReports: IssueReport[] };

    expect(response.status).toBe(200);
    expect(body.issueReports).toHaveLength(1);
    expect(body.issueReports[0].id).toBe("issue-admin-read");
  });

  it("updates issue triage when admin writes are enabled", async () => {
    process.env.ENABLE_ADMIN_TOOLS = "true";
    process.env.ENABLE_ADMIN_WRITE_ACTIONS = "true";
    appendIssueReportToStore(createReport("issue-admin-update"));

    const response = await POST(
      new Request("http://localhost/api/admin/issues", {
        body: JSON.stringify({
          id: "issue-admin-update",
          status: "reviewing",
          severity: "high",
          reviewer: "QA",
          resolutionNotes: "Needs route copy update."
        }),
        headers: { "content-type": "application/json" },
        method: "POST"
      })
    );
    const body = (await response.json()) as { issueReport: IssueReport };

    expect(response.status).toBe(200);
    expect(body.issueReport).toMatchObject({
      id: "issue-admin-update",
      status: "reviewing",
      severity: "high",
      reviewer: "QA",
      resolutionNotes: "Needs route copy update."
    });
  });
});

function createReport(id: string): IssueReport {
  return {
    id,
    routeSlug: "old-montreal-monuments-loop",
    placeSlug: "place-darmes",
    category: "construction",
    severity: "medium",
    description: "Temporary closure near the stop.",
    createdAt: "2026-07-03T00:00:00.000Z",
    status: "new"
  };
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
