export type AppQuickFilter = {
  label: string;
  href: string;
};

export const appQuickFilters: AppQuickFilter[] = [
  { label: "monuments", href: "/places?category=monument" },
  { label: "churches", href: "/places?category=church" },
  { label: "markets", href: "/places?category=market" },
  { label: "viewpoints", href: "/places?category=viewpoint" },
  { label: "public art", href: "/places?category=public_art" },
  { label: "hidden gems", href: "/places?category=hidden_gem" },
  { label: "history", href: "/places?tag=history" },
  { label: "architecture", href: "/places?tag=architecture" },
  { label: "rainy day", href: "/places?tag=rainy%20day" },
  { label: "optional walks", href: "/routes" }
];
