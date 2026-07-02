import type { MediaAsset } from "@/lib/types";
import { isApprovedProductionImageAsset, isDirectRemoteMediaUrl, isGeneratedFallbackAsset, isRejectedLicenseName } from "./licenses";

type MediaOwner = {
  slug: string;
  media: MediaAsset[];
};

export type MediaValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: {
    totalMediaAssets: number;
    approvedRealPhotos: number;
    generatedFallbacks: number;
    rejectedOrNeedsReview: number;
  };
};

export function validateMediaCatalog({
  routes,
  places
}: {
  routes: MediaOwner[];
  places: MediaOwner[];
}): MediaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalMediaAssets = 0;
  let approvedRealPhotos = 0;
  let generatedFallbacks = 0;
  let rejectedOrNeedsReview = 0;

  for (const owner of [...routes.map((route) => ({ kind: "route" as const, ...route })), ...places.map((place) => ({ kind: "place" as const, ...place }))]) {
    if (!owner.media.length) {
      errors.push(`${owner.kind} ${owner.slug} is missing media.`);
      continue;
    }

    for (const asset of owner.media) {
      totalMediaAssets += 1;

      if (!asset.alt.trim()) {
        errors.push(`${owner.kind} ${owner.slug} media ${asset.id} is missing alt text.`);
      }

      if (asset.status === "rejected" || asset.status === "needs_review") {
        rejectedOrNeedsReview += 1;
      }

      if (isGeneratedFallbackAsset(asset)) {
        generatedFallbacks += 1;
        if (asset.role && asset.role !== "fallback") {
          errors.push(`${owner.kind} ${owner.slug} media ${asset.id} is generated but role is ${asset.role}; generated visuals must be fallback-only.`);
        }
      }

      if (asset.role && ["hero", "card"].includes(asset.role) && (asset.status === "needs_review" || asset.status === "rejected")) {
        errors.push(`${owner.kind} ${owner.slug} media ${asset.id} cannot be used as ${asset.role} while status is ${asset.status}.`);
      }

      if (asset.type === "image") {
        if (isDirectRemoteMediaUrl(asset.url) || isDirectRemoteMediaUrl(asset.localPath)) {
          errors.push(`${owner.kind} ${owner.slug} media ${asset.id} is hotlinked; production media must use localPath.`);
        }

        if (asset.status === "approved") {
          if (!asset.localPath) {
            errors.push(`${owner.kind} ${owner.slug} media ${asset.id} is approved but missing localPath.`);
          }

          if (asset.sourceType !== "owned_internal" && (!asset.sourceUrl || !asset.licenseName || !asset.licenseUrl)) {
            errors.push(`${owner.kind} ${owner.slug} media ${asset.id} is missing license metadata.`);
          }

          if (isRejectedLicenseName(asset.licenseName) || asset.licenseAllowsCommercialUse === false) {
            errors.push(`${owner.kind} ${owner.slug} media ${asset.id} has a rejected or non-commercial license.`);
          }

          const assetId = asset.id;
          if (isApprovedProductionImageAsset(asset)) {
            approvedRealPhotos += 1;
          } else {
            warnings.push(`${owner.kind} ${owner.slug} media ${assetId} is approved but does not meet production image rules.`);
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      totalMediaAssets,
      approvedRealPhotos,
      generatedFallbacks,
      rejectedOrNeedsReview
    }
  };
}
