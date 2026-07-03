import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout, { metadata } from "./layout";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  }
}));

afterEach(() => {
  delete process.env.ENABLE_ADMIN_TOOLS;
});

describe("admin tool gating", () => {
  it("keeps admin routes noindexed", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    });
  });

  it("blocks admin surfaces unless ENABLE_ADMIN_TOOLS is true", () => {
    expect(() => renderToStaticMarkup(renderLayout())).toThrow("NEXT_NOT_FOUND");
  });

  it("renders admin surfaces when explicitly enabled", () => {
    process.env.ENABLE_ADMIN_TOOLS = "true";

    const html = renderToStaticMarkup(renderLayout());

    expect(html).toContain("Route QA");
  });
});

function renderLayout() {
  return React.createElement(AdminLayout, null, React.createElement("main", null, "Route QA"));
}
