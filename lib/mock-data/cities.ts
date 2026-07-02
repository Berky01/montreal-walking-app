import type { City } from "@/lib/types";

export const cities: City[] = [
  {
    id: "montreal",
    slug: "montreal",
    name: "Montreal",
    region: "Quebec",
    country: "Canada",
    locale: "en-CA",
    timezone: "America/Toronto",
    center: { lat: 45.5019, lng: -73.5674 },
    isMvpCity: true,
    status: "active"
  }
];

export const montreal = cities[0];
