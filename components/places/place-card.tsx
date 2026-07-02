"use client";

import Link from "next/link";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { SaveButton } from "@/components/library/save-button";
import { PlaceCover } from "@/components/media/PlaceCover";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { Place } from "@/lib/types";
import { getPlaceCategoryLabel } from "@/lib/visual-system";
import { cn } from "@/lib/utils/cn";

export function PlaceCard({
  place,
  selected = false,
  onPreview,
  variant = "default",
  matchReasons = []
}: {
  place: Place;
  selected?: boolean;
  onPreview?: (place: Place) => void;
  variant?: "default" | "large" | "compact" | "saved" | "map";
  matchReasons?: string[];
}) {
  const compact = variant === "compact" || variant === "map";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border bg-surface-container-lowest shadow-card transition-shadow hover:shadow-floating",
        selected ? "border-primary" : "border-outline-variant/70"
      )}
      onClickCapture={(event) => {
        if (isInteractiveTarget(event.target)) {
          return;
        }
        onPreview?.(place);
      }}
      onFocusCapture={() => onPreview?.(place)}
      onMouseEnter={() => onPreview?.(place)}
    >
      <div className={cn("relative bg-surface-container-high", variant === "large" ? "h-44" : compact ? "h-24" : "h-32")}>
        <Link aria-label={`Open ${place.name}`} className="absolute inset-0" href={`/places/${place.slug}`}>
          <PlaceCover place={place} />
        </Link>
        <SaveButton className="absolute right-3 top-3 z-10" compact itemId={place.id} itemSlug={place.slug} itemTitle={place.name} itemType="place" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link className="rounded-control hover:text-primary" href={`/places/${place.slug}`}>
            <h3 className="text-body-lg font-semibold text-on-surface">{place.name}</h3>
          </Link>
          <Chip tone="secondary">{getPlaceCategoryLabel(place.category)}</Chip>
        </div>
        <p className="mt-2 line-clamp-2 text-body-md text-on-surface-variant">{place.shortDescription}</p>
        {!compact ? <p className="mt-3 line-clamp-2 text-label-md text-on-surface">{place.whyItMatters}</p> : null}
        <div className="mt-4 grid gap-2 text-label-sm text-on-surface-variant sm:grid-cols-2">
          <p className="flex items-center gap-1">
            <MapPin aria-hidden="true" size={15} />
            {place.area}
          </p>
          <p className="flex items-center gap-1">
            <RouteIcon aria-hidden="true" size={15} />
            {place.relatedRouteSlugs.length ? `Optional in ${place.relatedRouteSlugs.length} routes` : "Independent discovery"}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {place.tags.slice(0, compact ? 2 : 4).map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        {matchReasons.length ? (
          <div className="mt-3 rounded-control bg-surface-container-low px-3 py-2">
            <p className="text-label-sm font-semibold text-on-surface">Why this matched</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {matchReasons.map((reason) => (
                <Chip key={reason} tone="primary">{reason}</Chip>
              ))}
            </div>
          </div>
        ) : null}
        <div className={cn("mt-4 grid gap-2", onPreview ? "sm:grid-cols-2" : "")}>
          <ButtonLink className="w-full" href={`/places/${place.slug}`} variant="secondary">
            View place
          </ButtonLink>
          {onPreview ? (
            <Button
              className="w-full"
              onClick={(event) => {
                event.stopPropagation();
                onPreview(place);
                scrollVisibleMapIntoView();
              }}
              variant="ghost"
            >
              Show on map
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("a,button,input,label,select,textarea"));
}

function scrollVisibleMapIntoView() {
  const maps = Array.from(document.querySelectorAll<HTMLElement>("[data-map-shell='true']"));
  const visibleMap = maps.find((map) => {
    const style = window.getComputedStyle(map);
    const rect = map.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  });

  visibleMap?.scrollIntoView({ behavior: "smooth", block: "start" });
}
