import type { Place, Route } from "@/lib/types";

export type VisualTheme = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  soft: string;
  ink: string;
  pattern: "stone" | "topographic" | "waterfront" | "facades" | "grid" | "market" | "civic";
};

const routeThemes: VisualTheme[] = [
  {
    id: "old-montreal",
    label: "Heritage stone",
    primary: "#31523d",
    secondary: "#8f755f",
    accent: "#c6a66a",
    soft: "#efe7dc",
    ink: "#1d2b24",
    pattern: "stone"
  },
  {
    id: "mount-royal",
    label: "Mountain paths",
    primary: "#245b3d",
    secondary: "#6a8f55",
    accent: "#d7b46a",
    soft: "#e7f0e4",
    ink: "#183021",
    pattern: "topographic"
  },
  {
    id: "lachine-canal",
    label: "Canal edge",
    primary: "#245f73",
    secondary: "#4c8a94",
    accent: "#d59a4a",
    soft: "#e3eff1",
    ink: "#142b33",
    pattern: "waterfront"
  },
  {
    id: "plateau-mile-end",
    label: "Neighborhood facades",
    primary: "#7a3f4b",
    secondary: "#d07b4c",
    accent: "#4f8b7a",
    soft: "#f4e6e2",
    ink: "#341f24",
    pattern: "facades"
  },
  {
    id: "downtown",
    label: "Downtown grid",
    primary: "#314d68",
    secondary: "#617d8f",
    accent: "#d1a84b",
    soft: "#e7edf1",
    ink: "#172838",
    pattern: "grid"
  },
  {
    id: "old-port",
    label: "Harbor walk",
    primary: "#2d6472",
    secondary: "#81989d",
    accent: "#b9874d",
    soft: "#e4eef0",
    ink: "#172d33",
    pattern: "waterfront"
  },
  {
    id: "little-italy",
    label: "Market streets",
    primary: "#6f4931",
    secondary: "#b95f45",
    accent: "#3f7b5f",
    soft: "#f2e8de",
    ink: "#2b211b",
    pattern: "market"
  }
];

const defaultRouteTheme: VisualTheme = {
  id: "montreal",
  label: "Montreal walk",
  primary: "#154212",
  secondary: "#3f627e",
  accent: "#9b6a33",
  soft: "#e8ece3",
  ink: "#182217",
  pattern: "civic"
};

const placeThemes: Record<string, VisualTheme> = {
  square: {
    id: "square",
    label: "Public square",
    primary: "#345c45",
    secondary: "#9b8264",
    accent: "#d4b76f",
    soft: "#eee7da",
    ink: "#1f2c23",
    pattern: "civic"
  },
  public_square: {
    id: "public-square",
    label: "Public square",
    primary: "#345c45",
    secondary: "#9b8264",
    accent: "#d4b76f",
    soft: "#eee7da",
    ink: "#1f2c23",
    pattern: "civic"
  },
  church: {
    id: "church",
    label: "Church",
    primary: "#4d456a",
    secondary: "#8b7e9e",
    accent: "#c7a75f",
    soft: "#ece7f0",
    ink: "#252238",
    pattern: "stone"
  },
  museum: {
    id: "museum",
    label: "Museum",
    primary: "#425b72",
    secondary: "#7d91a1",
    accent: "#bd8b4e",
    soft: "#e8edf1",
    ink: "#1d2c38",
    pattern: "grid"
  },
  viewpoint: {
    id: "viewpoint",
    label: "Viewpoint",
    primary: "#2d6370",
    secondary: "#77a0a3",
    accent: "#e0b55c",
    soft: "#e4eff0",
    ink: "#162d33",
    pattern: "topographic"
  },
  cafe: {
    id: "cafe",
    label: "Cafe",
    primary: "#74452e",
    secondary: "#b66a43",
    accent: "#587a55",
    soft: "#f0e5dc",
    ink: "#2d2019",
    pattern: "facades"
  },
  cafe_adjacent_stop: {
    id: "cafe-stop",
    label: "Cafe stop",
    primary: "#74452e",
    secondary: "#b66a43",
    accent: "#587a55",
    soft: "#f0e5dc",
    ink: "#2d2019",
    pattern: "facades"
  },
  park: {
    id: "park",
    label: "Park",
    primary: "#2d5c3d",
    secondary: "#7a955c",
    accent: "#d2b75d",
    soft: "#e8f0e1",
    ink: "#192c20",
    pattern: "topographic"
  },
  market: {
    id: "market",
    label: "Market",
    primary: "#6f4931",
    secondary: "#b95f45",
    accent: "#3f7b5f",
    soft: "#f2e8de",
    ink: "#2b211b",
    pattern: "market"
  },
  historic_building: {
    id: "heritage",
    label: "Historic building",
    primary: "#53613f",
    secondary: "#9a8463",
    accent: "#c59f5b",
    soft: "#ede8dd",
    ink: "#242b1d",
    pattern: "stone"
  },
  heritage_building: {
    id: "heritage-building",
    label: "Heritage building",
    primary: "#53613f",
    secondary: "#9a8463",
    accent: "#c59f5b",
    soft: "#ede8dd",
    ink: "#242b1d",
    pattern: "stone"
  },
  architecture: {
    id: "architecture",
    label: "Architecture",
    primary: "#354e67",
    secondary: "#768899",
    accent: "#c7974d",
    soft: "#e9edf0",
    ink: "#172638",
    pattern: "grid"
  },
  public_art: {
    id: "public-art",
    label: "Public art",
    primary: "#6a4568",
    secondary: "#b16772",
    accent: "#d3a342",
    soft: "#f0e5ed",
    ink: "#2d1e2d",
    pattern: "facades"
  },
  waterfront: {
    id: "waterfront",
    label: "Waterfront",
    primary: "#2d6472",
    secondary: "#81989d",
    accent: "#b9874d",
    soft: "#e4eef0",
    ink: "#172d33",
    pattern: "waterfront"
  },
  campus: {
    id: "campus",
    label: "Campus",
    primary: "#455a73",
    secondary: "#8793a2",
    accent: "#b98d46",
    soft: "#e8edf2",
    ink: "#1c2b3b",
    pattern: "grid"
  },
  street: {
    id: "street",
    label: "Street",
    primary: "#6b4a34",
    secondary: "#ab7652",
    accent: "#4d7c75",
    soft: "#eee5dd",
    ink: "#2a211b",
    pattern: "facades"
  },
  hidden_gem: {
    id: "hidden-gem",
    label: "Hidden gem",
    primary: "#4b5f41",
    secondary: "#8a7a61",
    accent: "#ba984d",
    soft: "#e9eadf",
    ink: "#222a1c",
    pattern: "stone"
  },
  monument: {
    id: "monument",
    label: "Monument",
    primary: "#46583f",
    secondary: "#8d8268",
    accent: "#c6a356",
    soft: "#ebe7dc",
    ink: "#20281c",
    pattern: "civic"
  }
};

export function getRouteVisualTheme(route: Pick<Route, "area" | "tags" | "interests" | "moodTags">): VisualTheme {
  const text = normalize([route.area, ...route.tags, ...route.interests, ...route.moodTags].join(" "));

  if (text.includes("mount royal") || text.includes("nature") || text.includes("viewpoint")) {
    return routeThemes.find((theme) => theme.id === "mount-royal") ?? defaultRouteTheme;
  }

  if (text.includes("lachine") || text.includes("canal")) {
    return routeThemes.find((theme) => theme.id === "lachine-canal") ?? defaultRouteTheme;
  }

  if (text.includes("plateau") || text.includes("mile end")) {
    return routeThemes.find((theme) => theme.id === "plateau-mile-end") ?? defaultRouteTheme;
  }

  if (text.includes("old port") || text.includes("harbor") || text.includes("river")) {
    return routeThemes.find((theme) => theme.id === "old-port") ?? defaultRouteTheme;
  }

  if (text.includes("little italy") || text.includes("market") || text.includes("food")) {
    return routeThemes.find((theme) => theme.id === "little-italy") ?? defaultRouteTheme;
  }

  if (text.includes("downtown") || text.includes("campus") || text.includes("public art")) {
    return routeThemes.find((theme) => theme.id === "downtown") ?? defaultRouteTheme;
  }

  if (text.includes("old montreal") || text.includes("heritage") || text.includes("church")) {
    return routeThemes.find((theme) => theme.id === "old-montreal") ?? defaultRouteTheme;
  }

  return defaultRouteTheme;
}

export function getPlaceVisualTheme(place: Pick<Place, "category" | "tags" | "area">): VisualTheme {
  return placeThemes[place.category] ?? getRouteVisualTheme({ area: place.area, tags: place.tags, interests: place.tags, moodTags: [] });
}

export function getNeighborhoodVisualTheme(name: string): VisualTheme {
  return getRouteVisualTheme({ area: name, tags: [name], interests: [], moodTags: [] });
}

export function getPlaceCategoryLabel(category: Place["category"]): string {
  return category.replace(/_/g, " ");
}

export function getRouteShapeLabel(routeType: Route["routeType"]): string {
  if (routeType === "one_way") {
    return "One-way";
  }

  if (routeType === "out_and_back") {
    return "Out and back";
  }

  return "Loop";
}

export function getRouteMoodLine(route: Pick<Route, "bestFor" | "moodTags" | "bestTime">): string {
  const audience = route.bestFor.slice(0, 2).join(", ");
  const mood = route.moodTags.slice(0, 2).join(" and ");
  return `Best for ${audience.toLowerCase()}${mood ? ` with a ${mood} feel` : ""}. ${route.bestTime}.`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
