import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendIssueReportToStore,
  readIssueReportsFromStore,
  resolveIssueReportStorePath,
  updateIssueReportInStore
} from "@/lib/data/issue-report-store";
import type { IssueReport } from "@/lib/types";

let tempDir = "";
let previousStorePath: string | undefined;

beforeEach(() => {
  previousStorePath = process.env.ISSUE_REPORT_STORE_PATH;
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "meaningful-routes-issues-"));
  process.env.ISSUE_REPORT_STORE_PATH = path.join(tempDir, "issue-reports.json");
});

afterEach(() => {
  if (previousStorePath === undefined) {
    delete process.env.ISSUE_REPORT_STORE_PATH;
  } else {
    process.env.ISSUE_REPORT_STORE_PATH = previousStorePath;
  }

  fs.rmSync(tempDir, { force: true, recursive: true });
});

describe("issue report file store", () => {
  it("persists issue reports to the configured store path", () => {
    const report = createReport("issue-one");

    appendIssueReportToStore(report);

    expect(resolveIssueReportStorePath()).toContain(tempDir);
    expect(readIssueReportsFromStore()).toEqual([report]);
    expect(fs.existsSync(process.env.ISSUE_REPORT_STORE_PATH!)).toBe(true);
  });

  it("updates triage fields without dropping the submitted context", () => {
    appendIssueReportToStore(createReport("issue-two"));

    const updated = updateIssueReportInStore({
      id: "issue-two",
      status: "resolved",
      severity: "high",
      reviewer: "QA reviewer",
      resolutionNotes: "Updated closure note."
    });

    expect(updated).toMatchObject({
      id: "issue-two",
      routeSlug: "old-montreal-monuments-loop",
      placeSlug: "place-darmes",
      status: "resolved",
      severity: "high",
      reviewer: "QA reviewer",
      resolutionNotes: "Updated closure note."
    });
    expect(readIssueReportsFromStore()[0]).toMatchObject({ id: "issue-two", status: "resolved" });
  });
});

function createReport(id: string): IssueReport {
  return {
    id,
    routeSlug: "old-montreal-monuments-loop",
    placeSlug: "place-darmes",
    category: "incorrect_information",
    severity: "medium",
    description: "The plaque text changed.",
    createdAt: "2026-07-03T00:00:00.000Z",
    status: "new"
  };
}
