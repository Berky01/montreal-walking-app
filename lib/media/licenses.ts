import type { MediaAsset, Source } from "@/lib/types";

export function isDirectRemoteMediaUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith("http://") || url?.startsWith("https://"));
}

export function isRejectedLicenseName(licenseName: string | undefined): boolean {
  const normalized = normalizeLicenseName(licenseName);

  if (!normalized) {
    return true;
  }

  return (
    normalized.includes("unknown") ||
    normalized.includes("all rights reserved") ||
    normalized.includes("by-nc") ||
    normalized.includes("noncommercial") ||
    normalized.includes("non-commercial")
  );
}

export function isCommercialSafeLicenseName(licenseName: string | undefined): boolean {
  const normalized = normalizeLicenseName(licenseName);

  if (!normalized || isRejectedLicenseName(normalized)) {
    return false;
  }

  return (
    normalized.includes("public domain") ||
    normalized === "pd" ||
    normalized.includes("cc0") ||
    normalized.includes("cc by") ||
    normalized.includes("cc-by") ||
    normalized.includes("creative commons attribution") ||
    normalized.includes("internal generated visual") ||
    normalized.includes("owned/internal")
  );
}

export function isApprovedProductionImageAsset(asset: MediaAsset | undefined): asset is MediaAsset {
  if (!asset || asset.type !== "image" || asset.status !== "approved") {
    return false;
  }

  if (!asset.localPath || isDirectRemoteMediaUrl(asset.localPath) || isDirectRemoteMediaUrl(asset.url)) {
    return false;
  }

  if (!asset.alt.trim()) {
    return false;
  }

  if (asset.sourceType === "owned_internal") {
    return Boolean(asset.attributionText || asset.creator);
  }

  return Boolean(
    asset.sourceUrl &&
      asset.creator &&
      asset.licenseName &&
      asset.licenseAllowsCommercialUse &&
      isCommercialSafeLicenseName(asset.licenseName)
  );
}

export function isGeneratedFallbackAsset(asset: MediaAsset | undefined): asset is MediaAsset {
  return Boolean(asset && asset.type === "generated" && asset.status === "fallback_only");
}

export function describeMediaAttribution(media: MediaAsset[], sources: Source[] = []): string {
  const asset = media[0];
  const mediaLabel = asset?.attributionText ?? asset?.credit ?? asset?.source ?? (asset?.type === "generated" ? "Generated local visual" : "Editorial visual");
  const sourceLabel = sources[0]?.label;

  if (asset?.attributionText) {
    return asset.attributionText;
  }

  return sourceLabel ? `${mediaLabel} reviewed by ${sourceLabel}` : mediaLabel;
}

function normalizeLicenseName(licenseName: string | undefined): string {
  return (licenseName ?? "").trim().toLowerCase();
}
