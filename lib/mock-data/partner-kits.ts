import type { PartnerKit } from "@/lib/types";

export const partnerKits: PartnerKit[] = [
  {
    id: "partner-kit-montreal-guest-walk",
    slug: "montreal-guest-walk-kit",
    cityId: "montreal",
    partnerName: "Guest Route Kit Preview",
    title: "Montreal Guest Walk Kit",
    summary: "A future partner-kit scaffold for hotels, cultural venues, and guest hosts. Not exposed in primary navigation.",
    routeSlugs: ["old-montreal-monuments-loop", "place-darmes-circuit"],
    status: "flagged"
  }
];
