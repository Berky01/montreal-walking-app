import { describe, expect, it } from "vitest";
import { appQuickFilters } from "@/lib/app-quick-filters";

describe("app quick filters", () => {
  it("links each home chip to route results with meaningful filter params", () => {
    expect(appQuickFilters).toEqual([
      { label: "30 min", href: "/routes?duration=35" },
      { label: "1 hour", href: "/routes?duration=60" },
      { label: "2 hours", href: "/routes?duration=120" },
      { label: "quiet", href: "/routes?interest=quiet" },
      { label: "scenic", href: "/routes?interest=scenic&sort=scenic" },
      { label: "history", href: "/routes?interest=history" },
      { label: "architecture", href: "/routes?interest=architecture" },
      { label: "cafes", href: "/routes?interest=cafes" },
      { label: "rainy day", href: "/routes?weather=rainy" },
      { label: "accessible", href: "/routes?accessible=true" }
    ]);
  });
});
