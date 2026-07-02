import type { CSSProperties, ReactNode } from "react";
import {
  Building2,
  Church,
  Coffee,
  Footprints,
  Landmark,
  MapPinned,
  Mountain,
  Palette,
  Store,
  Trees,
  University,
  Waves
} from "lucide-react";
import { SaveButton } from "@/components/library/save-button";
import { PhotoWithCredit } from "@/components/media/PhotoWithCredit";
import { ShareButton } from "@/components/share/share-button";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  getNeighborhoodVisualTheme,
  getPlaceCategoryLabel,
  getPlaceVisualTheme,
  getRouteMoodLine,
  getRouteShapeLabel,
  getRouteVisualTheme,
  type VisualTheme
} from "@/lib/visual-system";
import { getPrimaryMediaAsset } from "@/lib/media/media-selection";
import type { Place, Route } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type VisualSize = "sm" | "md" | "lg" | "hero";

const sizeClasses: Record<VisualSize, string> = {
  sm: "h-28",
  md: "h-36",
  lg: "h-48",
  hero: "min-h-[280px] md:min-h-[360px]"
};

export function RouteVisual({ route, className, size = "md" }: { route: Route; className?: string; size?: VisualSize }) {
  const theme = getRouteVisualTheme(route);

  return (
    <VisualFrame
      ariaLabel={`${route.title} visual route preview`}
      className={cn(sizeClasses[size], className)}
      theme={theme}
    >
      <VisualPattern theme={theme} />
      <svg aria-hidden="true" className="absolute inset-x-[8%] bottom-[18%] h-[58%] w-[84%]" viewBox="0 0 260 130">
        <path
          d="M8 98 C42 28 74 40 106 72 S174 118 206 60 S244 28 254 40"
          fill="none"
          stroke="rgba(255,255,255,0.82)"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <path
          d="M8 98 C42 28 74 40 106 72 S174 118 206 60 S244 28 254 40"
          fill="none"
          stroke={theme.accent}
          strokeDasharray="1 18"
          strokeLinecap="round"
          strokeWidth="7"
        />
        {[{ x: 8, y: 98 }, { x: 106, y: 72 }, { x: 206, y: 60 }, { x: 254, y: 40 }].map((point, index) => (
          <g key={`${point.x}-${point.y}`}>
            <circle cx={point.x} cy={point.y} fill="white" r="12" />
            <circle cx={point.x} cy={point.y} fill={index === 0 ? theme.primary : theme.ink} r="8" />
          </g>
        ))}
      </svg>
      <VisualBadge className="absolute left-3 top-3" theme={theme}>
        {route.area}
      </VisualBadge>
      <VisualBadge className="absolute bottom-3 right-3" theme={theme} variant="light">
        {getRouteShapeLabel(route.routeType)}
      </VisualBadge>
    </VisualFrame>
  );
}

export function PlaceVisual({ place, className, size = "md" }: { place: Place; className?: string; size?: VisualSize }) {
  const theme = getPlaceVisualTheme(place);
  const Icon = iconForPlace(place.category);

  return (
    <VisualFrame ariaLabel={`${place.name} visual place preview`} className={cn(sizeClasses[size], className)} theme={theme}>
      <VisualPattern theme={theme} />
      <div className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-control border border-white/45 bg-white/88 text-[color:var(--visual-primary)] shadow-card">
        <Icon aria-hidden="true" size={24} />
      </div>
      <div className="absolute inset-x-5 bottom-5">
        <p className="text-label-sm font-semibold text-white/85">{place.area}</p>
        <p className="mt-1 max-w-[18rem] text-body-lg font-semibold leading-tight text-white drop-shadow-sm">{getPlaceCategoryLabel(place.category)}</p>
      </div>
    </VisualFrame>
  );
}

export function NeighborhoodVisual({ name, className }: { name: string; className?: string }) {
  const theme = getNeighborhoodVisualTheme(name);

  return (
    <VisualFrame ariaLabel={`${name} neighborhood visual`} className={cn("h-32", className)} theme={theme}>
      <VisualPattern theme={theme} />
      <div className="absolute inset-x-4 bottom-4">
        <p className="text-label-sm text-white/80">Neighborhood</p>
        <p className="text-body-lg font-semibold text-white">{name}</p>
      </div>
    </VisualFrame>
  );
}

export function CityHeroVisual({ className }: { className?: string }) {
  const theme: VisualTheme = {
    id: "city-hero",
    label: "Montreal city discovery map",
    primary: "#154212",
    secondary: "#3f627e",
    accent: "#b9874d",
    soft: "#e6ece4",
    ink: "#142315",
    pattern: "civic"
  };

  return (
    <VisualFrame ariaLabel="Montreal discovery visual map" className={cn("min-h-[280px] md:min-h-[420px]", className)} theme={theme}>
      <VisualPattern theme={theme} />
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 460 340" preserveAspectRatio="none">
        <path d="M-20 246 C72 200 156 216 246 188 C326 164 388 132 492 150 L492 360 L-20 360 Z" fill="rgba(255,255,255,0.18)" />
        <path d="M0 248 C92 206 166 226 252 192 C324 164 396 136 460 154" fill="none" stroke="rgba(255,255,255,0.82)" strokeLinecap="round" strokeWidth="12" />
        <path d="M52 240 L120 176 L174 196 L228 124 L286 144 L356 84 L420 108" fill="none" stroke={theme.accent} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
        {[52, 174, 286, 420].map((x, index) => (
          <circle cx={x} cy={[240, 196, 144, 108][index]} fill="white" key={x} r="12" />
        ))}
        <g fill="rgba(255,255,255,0.22)">
          <rect height="64" rx="6" width="38" x="76" y="76" />
          <rect height="92" rx="6" width="38" x="124" y="48" />
          <rect height="72" rx="6" width="46" x="294" y="48" />
          <rect height="118" rx="6" width="42" x="350" y="18" />
        </g>
      </svg>
      <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
        {["Old Montreal", "Mount Royal", "Canal", "Plateau"].map((label) => (
          <VisualBadge key={label} theme={theme} variant="light">
            {label}
          </VisualBadge>
        ))}
      </div>
    </VisualFrame>
  );
}

export function RouteHero({ route, startName }: { route: Route; startName?: string }) {
  return (
    <section className="bg-surface-container-low text-on-surface">
      <div className="mx-auto grid max-w-7xl gap-6 px-page-mobile py-6 md:px-page-desktop md:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.72fr)]">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <Chip tone="primary">{route.area}</Chip>
            <Chip>{getRouteShapeLabel(route.routeType)}</Chip>
            <Chip>{route.difficulty}</Chip>
          </div>
          <h1 className="mt-4 max-w-4xl text-headline-mobile text-on-surface md:text-display-lg">{route.title}</h1>
          <p className="mt-4 max-w-3xl text-body-lg text-on-surface-variant">{route.description}</p>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Starts near {startName ?? "the first stop"}. {getRouteMoodLine(route)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`/routes/${route.slug}/live`}>
              <Footprints aria-hidden="true" size={17} />
              Start optional walk
            </ButtonLink>
            <SaveButton itemId={route.id} itemSlug={route.slug} itemTitle={route.title} itemType="route" />
            <ShareButton text={route.description} title={route.title} variant="secondary" />
          </div>
        </div>
        <PhotoWithCredit
          asset={getPrimaryMediaAsset(route.media, "hero")}
          className="min-h-[280px] min-w-0 shadow-floating md:min-h-[360px]"
          fallback={<RouteVisual className="min-w-0 shadow-floating" route={route} size="hero" />}
          priority
        />
      </div>
    </section>
  );
}

export function PlaceHero({ place }: { place: Place }) {
  return (
    <section className="bg-surface-container-low text-on-surface">
      <div className="mx-auto grid max-w-7xl gap-6 px-page-mobile py-6 md:px-page-desktop md:py-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,0.72fr)]">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            <Chip tone="primary">{place.area}</Chip>
            <Chip>{getPlaceCategoryLabel(place.category)}</Chip>
          </div>
          <h1 className="mt-4 max-w-4xl text-headline-mobile text-on-surface md:text-display-lg">{place.name}</h1>
          <p className="mt-4 max-w-3xl text-body-lg text-on-surface-variant">{place.shortDescription}</p>
          <p className="mt-3 max-w-3xl text-body-md text-on-surface-variant">{place.whyItMatters}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SaveButton itemId={place.id} itemSlug={place.slug} itemTitle={place.name} itemType="place" label="Save place" />
            <ShareButton text={place.shortDescription} title={place.name} variant="secondary" />
          </div>
        </div>
        <PhotoWithCredit
          asset={getPrimaryMediaAsset(place.media, "hero")}
          className="min-h-[280px] min-w-0 shadow-floating md:min-h-[360px]"
          fallback={<PlaceVisual className="min-w-0 shadow-floating" place={place} size="hero" />}
          priority
        />
      </div>
    </section>
  );
}

export function VisualBadge({
  children,
  className,
  theme,
  variant = "solid"
}: {
  children: ReactNode;
  className?: string;
  theme: VisualTheme;
  variant?: "solid" | "light";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-control px-3 py-1 text-label-sm font-semibold shadow-card",
        variant === "solid" ? "bg-white/90 text-[color:var(--visual-primary)]" : "bg-black/20 text-white backdrop-blur",
        className
      )}
      style={visualStyle(theme)}
    >
      {children}
    </span>
  );
}

export function VisualGradient({ className, theme }: { className?: string; theme: VisualTheme }) {
  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary} 58%, ${theme.accent})`
      }}
    />
  );
}

export function VisualPattern({ theme }: { theme: VisualTheme }) {
  if (theme.pattern === "topographic") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 320 180" preserveAspectRatio="none">
        <path d="M-20 130 C40 82 72 92 122 58 S210 28 348 70" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="2" />
        <path d="M-20 156 C54 112 92 124 150 82 S232 58 348 94" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <path d="M-20 76 C38 38 86 36 130 28 S230 16 348 46" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      </svg>
    );
  }

  if (theme.pattern === "waterfront") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 320 180" preserveAspectRatio="none">
        <path d="M-20 126 C50 92 96 118 156 92 S252 62 340 86 L340 190 L-20 190 Z" fill="rgba(255,255,255,0.18)" />
        <path d="M-20 130 C50 96 96 122 156 96 S252 66 340 90" fill="none" stroke="rgba(255,255,255,0.46)" strokeWidth="3" />
        <path d="M-20 148 C50 116 106 138 168 116 S258 90 340 108" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="2" />
      </svg>
    );
  }

  if (theme.pattern === "facades" || theme.pattern === "market") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-75" viewBox="0 0 320 180" preserveAspectRatio="none">
        {[0, 44, 88, 132, 176, 220, 264].map((x, index) => (
          <rect fill={index % 2 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.24)"} height={120 + (index % 3) * 18} key={x} rx="5" width="34" x={x} y={44 - (index % 2) * 18} />
        ))}
        <path d="M0 142 L320 142" stroke="rgba(255,255,255,0.32)" strokeWidth="3" />
      </svg>
    );
  }

  if (theme.pattern === "grid") {
    return (
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-75" viewBox="0 0 320 180" preserveAspectRatio="none">
        {Array.from({ length: 8 }).map((_, index) => (
          <path d={`M${index * 46 - 24} -20 L${index * 46 + 82} 200`} key={`a-${index}`} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <path d={`M-20 ${index * 34} L340 ${index * 34 - 28}`} key={`b-${index}`} stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
        ))}
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-75" viewBox="0 0 320 180" preserveAspectRatio="none">
      <path d="M-20 42 L70 24 L144 50 L238 20 L340 44" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="3" />
      <path d="M-20 96 L84 76 L154 104 L232 72 L340 96" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
      <path d="M-20 150 L94 126 L168 154 L252 124 L340 142" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
    </svg>
  );
}

export function StopMarkerBadge({
  index,
  className,
  state = "default"
}: {
  index: number;
  className?: string;
  state?: "default" | "selected" | "visited" | "next" | "skipped";
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-label-sm font-bold shadow-card",
        state === "visited" && "border-primary bg-primary text-on-primary",
        state === "selected" && "border-tertiary bg-tertiary text-white",
        state === "next" && "border-secondary bg-secondary text-white",
        state === "skipped" && "border-outline-variant bg-surface-container text-on-surface-variant",
        state === "default" && "border-white bg-surface-container-lowest text-primary",
        className
      )}
    >
      {index}
    </span>
  );
}

function VisualFrame({
  ariaLabel,
  children,
  className,
  theme
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  theme: VisualTheme;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn("relative isolate h-full w-full overflow-hidden rounded-card", className)}
      role="img"
      style={visualStyle(theme)}
    >
      <VisualGradient theme={theme} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_84%_72%,rgba(0,0,0,0.16),transparent_30%)]" />
      {children}
    </div>
  );
}

function visualStyle(theme: VisualTheme): CSSProperties {
  return {
    "--visual-primary": theme.primary,
    "--visual-secondary": theme.secondary,
    "--visual-accent": theme.accent,
    "--visual-soft": theme.soft,
    "--visual-ink": theme.ink
  } as CSSProperties;
}

function iconForPlace(category: Place["category"]) {
  if (category === "church") return Church;
  if (category === "museum") return Landmark;
  if (category === "viewpoint") return Mountain;
  if (category === "cafe" || category === "cafe_adjacent_stop") return Coffee;
  if (category === "park") return Trees;
  if (category === "market") return Store;
  if (category === "waterfront") return Waves;
  if (category === "campus") return University;
  if (category === "public_art") return Palette;
  if (category === "historic_building" || category === "heritage_building" || category === "architecture") return Building2;
  return MapPinned;
}
