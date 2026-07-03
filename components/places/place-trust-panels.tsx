import type { ReactNode } from "react";
import { CalendarDays, Camera, CheckCircle2, ExternalLink, FileText, History, MapPin, ShieldCheck } from "lucide-react";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { PhotoWithCredit } from "@/components/media/PhotoWithCredit";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  getMediaSourceLabel,
  getPlaceSourceTrustSummary,
  getSourceTypeLabel,
  getThenNowMedia,
  type TrustTone
} from "@/lib/content-trust";
import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import type { MediaAsset, Place, Source } from "@/lib/types";

export function PlaceTrustOverview({ place }: { place: Place }) {
  const summary = getPlaceSourceTrustSummary(place);
  const licenses = summary.licenseLabels.length ? summary.licenseLabels.join(", ") : "License review pending";

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-label-sm text-primary">Source record</p>
          <h2 className="mt-1 text-headline-mobile text-on-surface">{place.name}</h2>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{place.shortDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <TrustChip tone={summary.qualityTone}>{summary.qualityLabel}</TrustChip>
          <TrustChip tone={summary.hasVerifiedSources ? "primary" : "tertiary"}>{summary.verifiedSourceCount} verified sources</TrustChip>
          <TrustChip tone={summary.approvedPhotoCount ? "secondary" : "tertiary"}>{summary.approvedPhotoCount} approved photos</TrustChip>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-body-md sm:grid-cols-2 lg:grid-cols-4">
        <FactItem icon={<MapPin aria-hidden="true" size={17} />} label="Area" value={place.area} />
        <FactItem icon={<CalendarDays aria-hidden="true" size={17} />} label="Reviewed" value={summary.reviewDateLabel} />
        <FactItem icon={<ShieldCheck aria-hidden="true" size={17} />} label="Primary source" value={summary.primarySourceLabel} />
        <FactItem icon={<Camera aria-hidden="true" size={17} />} label="Image license" value={licenses} />
      </dl>
    </Card>
  );
}

export function PlaceStoryAndTimeline({ place }: { place: Place }) {
  const summary = getPlaceSourceTrustSummary(place);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <p className="text-label-sm text-primary">Historical context</p>
        <h2 className="mt-1 text-headline-mobile text-on-surface">Why it matters</h2>
        <p className="mt-3 text-body-md text-on-surface-variant">{place.whyItMatters}</p>
        <h3 className="mt-6 text-body-lg font-semibold text-on-surface">Story</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">{place.story}</p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-primary">
          <History aria-hidden="true" size={18} />
          <h2 className="text-headline-mobile text-on-surface">Source timeline</h2>
        </div>
        <ol className="mt-4 space-y-4">
          <TimelineItem label="Place layer" value={place.periodOrStyle ?? "Period review pending"} />
          <TimelineItem label="Editorial review" value={`${summary.qualityLabel} on ${summary.reviewDateLabel}`} />
          <TimelineItem label="Walking context" value={`${place.area} stop with ${place.practicalInfo.length} practical notes`} />
        </ol>
      </Card>
    </div>
  );
}

export function ThenNowComparison({ place }: { place: Place }) {
  const media = getThenNowMedia(place.media);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-outline-variant p-5">
        <p className="text-label-sm text-primary">Historical media</p>
        <h2 className="mt-1 text-headline-mobile text-on-surface">Then and now</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {media.hasHistoricalMedia
            ? "Archival and current views are shown from approved media records."
            : "No archival image is attached yet; the current image remains source-checked before display."}
        </p>
      </div>
      <div className="grid gap-px bg-outline-variant md:grid-cols-2">
        <MediaComparePane
          asset={media.thenAsset}
          fallbackLabel="Archival reference needed"
          label="Then"
          placeholderAlt={`Historical media placeholder for ${place.name}.`}
        />
        <MediaComparePane
          asset={media.nowAsset}
          fallbackLabel="Current image pending"
          label="Now"
          placeholderAlt={`Current media placeholder for ${place.name}.`}
        />
      </div>
    </Card>
  );
}

export function SourceDrawerPanel({ place }: { place: Place }) {
  const media = getThenNowMedia(place.media);
  const approvedPhotos = media.approvedPhotos;

  return (
    <Card className="p-5">
      <details className="group" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span>
            <span className="text-label-sm text-primary">Source drawer</span>
            <span className="mt-1 block text-headline-mobile text-on-surface">Sources and licensing</span>
          </span>
          <span className="rounded-control border border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant group-open:bg-surface-container">
            Details
          </span>
        </summary>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <SourceList sources={place.sources} />
          <MediaSourceList assets={approvedPhotos} />
        </div>

        {!media.hasHistoricalMedia ? (
          <div className="mt-5 rounded-card border border-outline-variant bg-surface-container-low p-4">
            <p className="text-label-sm text-on-surface">Historical media status</p>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Archival comparison is waiting on a licensed historical asset. The page does not fabricate a then image from current media.
            </p>
          </div>
        ) : null}
      </details>
    </Card>
  );
}

function TrustChip({ children, tone }: { children: ReactNode; tone: TrustTone }) {
  return <Chip tone={tone}>{children}</Chip>;
}

function FactItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-container-low p-3">
      <dt className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-body-md font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-3">
      <span aria-hidden="true" className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 size={13} />
      </span>
      <span>
        <span className="block text-label-sm text-on-surface-variant">{label}</span>
        <span className="mt-1 block text-body-md text-on-surface">{value}</span>
      </span>
    </li>
  );
}

function MediaComparePane({
  asset,
  fallbackLabel,
  label,
  placeholderAlt
}: {
  asset?: MediaAsset;
  fallbackLabel: string;
  label: string;
  placeholderAlt: string;
}) {
  return (
    <div className="bg-surface-container-lowest p-4">
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Camera aria-hidden="true" size={17} />
        <h3 className="text-label-md">{label}</h3>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-container-high">
        <PhotoWithCredit
          asset={asset}
          className="h-full rounded-none"
          fallback={<MediaPlaceholder alt={placeholderAlt} className="rounded-none" kind="place" label={fallbackLabel} />}
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 text-primary">
        <FileText aria-hidden="true" size={18} />
        <h3 className="text-label-md text-on-surface">Editorial sources</h3>
      </div>
      <ul className="mt-3 space-y-3">
        {sources.map((source) => (
          <li className="rounded-card border border-outline-variant bg-surface-container-lowest p-3" key={source.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-body-md font-semibold text-on-surface">{source.label}</p>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {getSourceTypeLabel(source)} · {source.status.replace("_", " ")}
                </p>
              </div>
              <TrustChip tone={source.status === "verified" ? "primary" : "tertiary"}>{source.status === "verified" ? "Verified" : "Review"}</TrustChip>
            </div>
            {source.notes ? <p className="mt-2 text-body-md text-on-surface-variant">{source.notes}</p> : null}
            {source.url ? <SourceLink href={source.url} label="Open source" /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MediaSourceList({ assets }: { assets: MediaAsset[] }) {
  if (!assets.length) {
    return (
      <section className="rounded-card border border-outline-variant bg-surface-container-low p-4">
        <h3 className="text-label-md text-on-surface">Media sources</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">No approved production media is attached.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 text-primary">
        <Camera aria-hidden="true" size={18} />
        <h3 className="text-label-md text-on-surface">Media sources</h3>
      </div>
      <ul className="mt-3 space-y-3">
        {assets.filter(isApprovedProductionImageAsset).map((asset) => (
          <li className="rounded-card border border-outline-variant bg-surface-container-lowest p-3" key={asset.id}>
            <p className="text-body-md font-semibold text-on-surface">{asset.title ?? asset.alt}</p>
            <p className="mt-1 text-label-sm text-on-surface-variant">
              {getMediaSourceLabel(asset)} · {asset.licenseName ?? "License pending"}
            </p>
            {asset.creator ? <p className="mt-2 text-body-md text-on-surface-variant">Creator: {asset.creator}</p> : null}
            {asset.sourceUrl ? <SourceLink href={asset.sourceUrl} label="Open media source" /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="mt-3 inline-flex items-center gap-2 text-label-sm font-semibold text-primary hover:underline" href={href} rel="noreferrer" target="_blank">
      {label}
      <ExternalLink aria-hidden="true" size={14} />
    </a>
  );
}
