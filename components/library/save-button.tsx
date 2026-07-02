"use client";

import { Bookmark, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSavedItem, toggleSavedItem } from "@/lib/local-state";
import { cn } from "@/lib/utils/cn";
import type { SavedItem } from "@/lib/types";

export function SaveButton({
  itemType = "route",
  itemId,
  itemSlug,
  itemTitle,
  label,
  compact = false,
  className
}: {
  itemType?: SavedItem["itemType"];
  itemId?: string;
  itemSlug?: string;
  itemTitle?: string;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      if (itemSlug) {
        setSaved(isSavedItem(itemType, itemSlug));
      }
    }

    refresh();
    window.addEventListener("meaningful-routes-local-state", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [itemSlug, itemType]);

  function toggle() {
    setError(null);

    if (!itemId || !itemSlug || !itemTitle) {
      setSaved((value) => !value);
      return;
    }

    const result = toggleSavedItem({
      itemType,
      itemId,
      itemSlug,
      itemTitle
    });
    setSaved(result.saved);
    if (!result.ok) {
      setError("Could not update saved state. Check browser storage and try again.");
    }
  }

  if (compact) {
    return (
      <span className={cn("relative inline-flex", className)}>
        <button
          aria-label={saved ? `Unsave ${itemTitle ?? itemSlug ?? "item"}` : `Save ${itemTitle ?? itemSlug ?? "item"}`}
          aria-pressed={saved}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-card",
            saved && "bg-primary text-on-primary"
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggle();
          }}
          type="button"
        >
          {saved ? <Check aria-hidden="true" size={17} /> : <Bookmark aria-hidden="true" size={17} />}
        </button>
        {error ? (
          <span className="absolute right-0 top-11 z-30 w-56 rounded-control bg-error px-3 py-2 text-label-sm text-white shadow-floating" role="alert">
            {error}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn("inline-grid gap-2", className)}>
      <Button aria-pressed={saved} onClick={toggle} variant={saved ? "secondary" : "primary"}>
        {saved ? <Check aria-hidden="true" size={17} /> : <Bookmark aria-hidden="true" size={17} />}
        {saved ? "Saved" : label ?? (itemType === "place" ? "Save place" : "Save route")}
      </Button>
      {error ? <p className="text-label-sm text-error" role="alert">{error}</p> : null}
    </div>
  );
}
