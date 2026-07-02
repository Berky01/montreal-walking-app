import { describe, expect, it } from "vitest";
import { getPlaceCategoryLabel, getPlaceVisualTheme, getRouteShapeLabel, getRouteVisualTheme } from "@/lib/visual-system";
import { getPlaceBySlug, getRouteBySlug } from "@/lib/data/index";

describe("visual system helpers", () => {
  it("assigns distinct route themes from route context", () => {
    const oldMontreal = getRouteBySlug("old-montreal-monuments-loop");
    const mountRoyal = getRouteBySlug("mount-royal-sunrise-loop");
    const canal = getRouteBySlug("lachine-canal-heritage-walk");

    expect(oldMontreal).toBeDefined();
    expect(mountRoyal).toBeDefined();
    expect(canal).toBeDefined();
    expect(getRouteVisualTheme(oldMontreal!).id).toBe("old-montreal");
    expect(getRouteVisualTheme(mountRoyal!).id).toBe("mount-royal");
    expect(getRouteVisualTheme(canal!).id).toBe("lachine-canal");
  });

  it("assigns place themes and display labels from category data", () => {
    const place = getPlaceBySlug("place-darmes");

    expect(place).toBeDefined();
    expect(getPlaceVisualTheme(place!).id).toBe("square");
    expect(getPlaceCategoryLabel("historic_building")).toBe("historic building");
  });

  it("formats route shape labels", () => {
    expect(getRouteShapeLabel("loop")).toBe("Loop");
    expect(getRouteShapeLabel("one_way")).toBe("One-way");
    expect(getRouteShapeLabel("out_and_back")).toBe("Out and back");
  });
});
