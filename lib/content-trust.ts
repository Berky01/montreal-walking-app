import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import type { MediaAsset, Place, Source } from "@/lib/types";
import { titleCase } from "@/lib/utils/format";

export type TrustTone = "primary" | "secondary" | "tertiary" | "neutral";

export type SourceTrustSummary = {
  qualityLabel: string;
  qualityTone: TrustTone;
  reviewDateLabel: string;
  sourceCount: number;
  verifiedSourceCount: number;
  approvedPhotoCount: number;
  licenseLabels: string[];
  primarySourceLabel: string;
  hasVerifiedSources: boolean;
};

export type ThenNowMedia = {
  thenAsset?: MediaAsset;
  nowAsset?: MediaAsset;
  approvedPhotos: MediaAsset[];
  hasHistoricalMedia: boolean;
};

export function getPlaceSourceTrustSummary(place: Place): SourceTrustSummary {
  const approvedPhotos = place.media.filter(isApprovedProductionImageAsset);
  const verifiedSourceCount = place.sources.filter((source) => source.status === "verified").length;
  const quality = getQualityPresentation(place.sourceQuality);

  return {
    qualityLabel: quality.label,
    qualityTone: quality.tone,
    reviewDateLabel: formatReviewDate(place.lastReviewedAt),
    sourceCount: place.sources.length,
    verifiedSourceCount,
    approvedPhotoCount: approvedPhotos.length,
    licenseLabels: getUniqueLicenseLabels(approvedPhotos),
    primarySourceLabel: place.sources[0]?.label ?? "Source review pending",
    hasVerifiedSources: verifiedSourceCount > 0
  };
}

export function getThenNowMedia(media: MediaAsset[]): ThenNowMedia {
  const approvedPhotos = media.filter(isApprovedProductionImageAsset);
  const thenAsset = approvedPhotos.find(isHistoricalMediaAsset);
  const nowAsset = approvedPhotos.find((asset) => asset.id !== thenAsset?.id && !isHistoricalMediaAsset(asset));

  return {
    thenAsset,
    nowAsset: nowAsset ?? (thenAsset ? undefined : approvedPhotos[0]),
    approvedPhotos,
    hasHistoricalMedia: Boolean(thenAsset)
  };
}

export function getSourceTypeLabel(source: Source): string {
  return titleCase(source.type);
}

export function getMediaSourceLabel(asset: MediaAsset): string {
  if (asset.sourceType) {
    return titleCase(asset.sourceType);
  }

  return asset.provider ? titleCase(asset.provider) : "Media source";
}

function getQualityPresentation(sourceQuality: Place["sourceQuality"]): { label: string; tone: TrustTone } {
  switch (sourceQuality) {
    case "field_tested":
      return { label: "Field tested", tone: "primary" };
    case "verified":
      return { label: "Source checked", tone: "primary" };
    case "draft":
      return { label: "Draft review", tone: "tertiary" };
  }
}

function getUniqueLicenseLabels(assets: MediaAsset[]): string[] {
  return [...new Set(assets.map((asset) => asset.licenseName).filter((licenseName): licenseName is string => Boolean(licenseName)))].sort();
}

function isHistoricalMediaAsset(asset: MediaAsset): boolean {
  const searchable = [asset.provider, asset.sourceType, asset.source, asset.title, asset.alt, asset.attributionText].filter(Boolean).join(" ").toLowerCase();

  return searchable.includes("archive") || searchable.includes("historical") || searchable.includes("public_domain_archive");
}

function formatReviewDate(value: string): string {
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (isoDate) {
    return isoDate;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Review date pending" : parsed.toISOString().slice(0, 10);
}
