import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import type { MediaAsset, Place, PlaceMedia, PlaceSource, Source } from "@/lib/types";
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

export type NormalizedPlaceTrustRecord = {
  sourceQualityScore: Place["sourceQuality"];
  lastReviewedAt: string;
  sources: PlaceSource[];
  media: PlaceMedia[];
  approvedMedia: PlaceMedia[];
  thenNow: ThenNowMedia;
};

export function getNormalizedPlaceTrustRecord(place: Place): NormalizedPlaceTrustRecord {
  const sources = place.sources.map(normalizePlaceSource);
  const media = place.media.map(normalizePlaceMedia);
  const approvedMedia = media.filter(isApprovedProductionImageAsset);

  return {
    sourceQualityScore: place.sourceQualityScore ?? place.sourceQuality,
    lastReviewedAt: formatReviewDate(place.lastReviewedAt),
    sources,
    media,
    approvedMedia,
    thenNow: getThenNowMedia(media)
  };
}

export function getPlaceSourceTrustSummary(place: Place): SourceTrustSummary {
  const trustRecord = getNormalizedPlaceTrustRecord(place);
  const verifiedSourceCount = trustRecord.sources.filter((source) => source.verificationStatus === "verified").length;
  const quality = getQualityPresentation(trustRecord.sourceQualityScore);

  return {
    qualityLabel: quality.label,
    qualityTone: quality.tone,
    reviewDateLabel: trustRecord.lastReviewedAt,
    sourceCount: trustRecord.sources.length,
    verifiedSourceCount,
    approvedPhotoCount: trustRecord.approvedMedia.length,
    licenseLabels: getUniqueLicenseLabels(trustRecord.approvedMedia),
    primarySourceLabel: trustRecord.sources[0]?.label ?? "Source review pending",
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

function normalizePlaceSource(source: Source): PlaceSource {
  return {
    ...source,
    verificationStatus: source.verificationStatus ?? source.status
  };
}

function normalizePlaceMedia(asset: MediaAsset): PlaceMedia {
  return {
    ...asset,
    approvalStatus: asset.approvalStatus ?? asset.status
  };
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
  if (asset.thenNowRole === "then" || asset.historicalRole === "archival" || asset.historicalRole === "historical") {
    return true;
  }

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
