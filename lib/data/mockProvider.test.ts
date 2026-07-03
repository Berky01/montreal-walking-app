import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createIssueReport, getIssueReports, updateIssueReport } from "@/lib/data/mockProvider";

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "meaningful-routes-issues-"));
  process.env.ISSUE_REPORT_STORE_PATH = path.join(tempDir, "issue-reports.json");
});

afterEach(() => {
  delete process.env.ISSUE_REPORT_STORE_PATH;
  fs.rmSync(tempDir, { force: true, recursive: true });
});

describe("mock provider issue reports", () => {
  it("updates issue report triage fields in the file-backed mock queue", () => {
    const report = createIssueReport({
      category: "safety",
      description: "Temporary sidewalk closure near the first stop.",
      routeSlug: "old-montreal-monuments-loop",
      severity: "medium"
    });

    const updated = updateIssueReport({
      id: report.id,
      status: "resolved",
      severity: "low",
      reviewer: "route QA",
      resolutionNotes: "Marked resolved after content review."
    });

    expect(updated).toMatchObject({
      id: report.id,
      status: "resolved",
      severity: "low",
      reviewer: "route QA",
      resolutionNotes: "Marked resolved after content review."
    });
    expect(updated?.updatedAt).toBeDefined();
    expect(getIssueReports().find((item) => item.id === report.id)).toMatchObject({
      status: "resolved",
      resolutionNotes: "Marked resolved after content review."
    });
  });
});
