import { AlertTriangle, CheckCircle, ExternalLink, FileText, Flag, Image, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { placeTrustRecords, trustedLiveRoutes } from '../data/placeTrustData';
import {
  buildLiveRouteTrustMetrics,
  getApprovedCurrentMedia,
  getApprovedHistoricalMedia,
  getPlaceSourceTrustSummary,
  getThenNowPair,
  sourceTypeLabel,
  type PlaceMedia,
  type PlaceSource,
  type PlaceTrustRecord,
} from '../lib/content-trust';

export function PlaceTrustPage({ slug }: { slug: string }) {
  const place = placeTrustRecords[slug];

  if (!place) {
    return (
      <main className="trust-route-page">
        <section className="trust-card">
          <h1>Place not found</h1>
          <p>The requested source record is not available in this public repository.</p>
        </section>
      </main>
    );
  }

  const summary = getPlaceSourceTrustSummary(place);

  return (
    <main className="trust-route-page">
      <section className="trust-hero">
        <span className="eyebrow">POI source trust</span>
        <h1>{place.name}</h1>
        <p>{place.summary}</p>
        <div className="trust-badge-row" aria-label="POI trust badges">
          <TrustBadge tone={place.verificationStatus === 'verified' ? 'good' : 'review'} icon={<ShieldCheck />}>{summary.verificationLabel}</TrustBadge>
          <TrustBadge tone={place.sourceQuality === 'verified' ? 'good' : 'review'} icon={<CheckCircle />}>{summary.qualityStateLabel}</TrustBadge>
          <TrustBadge tone="neutral" icon={<FileText />}>{summary.sourceQualityLabel}</TrustBadge>
          <TrustBadge tone="neutral" icon={<Flag />}>Last reviewed {summary.lastReviewedLabel}</TrustBadge>
        </div>
        <p className="media-attribution-summary">{summary.mediaAttributionSummary}</p>
        <div className="trust-action-row">
          <a className="primary-button" href="#source-drawer">Open source drawer</a>
          <a className="secondary-button" href={place.reportCorrectionHref}>Report correction</a>
        </div>
      </section>

      <SourceDrawer place={place} />
      <HistoricalMediaSection place={place} />
      <ThenNowModule place={place} />

      <section className="trust-card trust-boundary-note">
        <p>No public device, offline pack, or partner dashboard features are enabled.</p>
      </section>
    </main>
  );
}

export function AdminRouteQaPage({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <main className="trust-route-page">
        <section className="trust-card">
          <span className="eyebrow">Internal tools</span>
          <h1>Admin source QA is disabled</h1>
          <p>Set the explicit admin QA flag before showing source queues. No public admin dashboard is exposed.</p>
        </section>
      </main>
    );
  }

  const places = Object.values(placeTrustRecords);
  const historicalCoverage = places.filter((place) => getApprovedHistoricalMedia(place).length > 0).length;

  return (
    <main className="trust-route-page">
      <section className="trust-hero">
        <span className="eyebrow">Internal source review</span>
        <h1>Source QA queue</h1>
        <p>Gated source-readiness view for matching repository state to the deployed trust implementation.</p>
      </section>
      <section className="trust-grid">
        <div className="trust-card">
          <h2>Place source records</h2>
          <strong>{places.length}</strong>
          <p>{places.filter((place) => place.verificationStatus === 'verified').length} verified, {places.filter((place) => place.verificationStatus !== 'verified').length} needing review.</p>
        </div>
        <div className="trust-card">
          <h2>Historical media coverage</h2>
          <strong>{historicalCoverage}/{places.length}</strong>
          <p>Approved historical media exists where licensing and attribution are complete.</p>
        </div>
      </section>
    </main>
  );
}

export function LiveRouteTrustPage({ slug }: { slug: string }) {
  const route = trustedLiveRoutes[slug];

  if (!route) {
    return (
      <main className="trust-route-page">
        <section className="trust-card">
          <h1>Route not found</h1>
          <p>The requested live route trust record is not available.</p>
        </section>
      </main>
    );
  }

  const metrics = buildLiveRouteTrustMetrics(route, placeTrustRecords);

  return (
    <main className="trust-route-page">
      <section className="trust-hero">
        <span className="eyebrow">Live walk tracker</span>
        <h1>{route.title}</h1>
        <p>Local-first live walk metrics use planned route data unless a user explicitly enables browser location.</p>
      </section>
      <section className="trust-grid">
        <MetricCard label="Steps" value={metrics.steps.value} detail={metrics.steps.sourceLabel} />
        <MetricCard label="Pace" value={metrics.pace} detail="Estimated from planned walking duration" />
      </section>
      <section className="trust-card" aria-label="Current stop context">
        <h2>Current stop context</h2>
        <p>{metrics.currentStop.name}</p>
        <p>{metrics.currentStop.sourceCheckedLabel}</p>
        <p>Reviewed {metrics.currentStop.reviewDateLabel}</p>
      </section>
    </main>
  );
}

function SourceDrawer({ place }: { place: PlaceTrustRecord }) {
  return (
    <section className="trust-card" id="source-drawer" aria-label={`Source drawer for ${displayName(place.name)}`}>
      <div className="trust-card-heading">
        <div>
          <span className="eyebrow">Source drawer</span>
          <h2>Sources and licensing</h2>
        </div>
        <span className="drawer-trigger" role="button" tabIndex={0} aria-label={`Open source drawer for ${displayName(place.name)}`}>Open source drawer</span>
      </div>
      <div className="trust-source-list">
        {place.sources.map((source) => (
          <SourceItem key={source.id} source={source} />
        ))}
      </div>
    </section>
  );
}

function SourceItem({ source }: { source: PlaceSource }) {
  return (
    <article className="source-item">
      <div className="source-title-row">
        <h3>{source.title}</h3>
        <span className="source-type-badge">{sourceTypeLabel(source.type)}</span>
      </div>
      <dl className="source-detail-grid">
        <div><dt>Publisher</dt><dd>{source.publisher}</dd></div>
        <div><dt>License</dt><dd>License: {source.license}</dd></div>
        <div><dt>Attribution</dt><dd>{source.attribution}</dd></div>
        <div><dt>Reliability</dt><dd>Reliability: {source.reliability === 'verified' ? 'Verified' : source.reliability === 'draft' ? 'Draft' : 'Review needed'}</dd></div>
        <div><dt>Accessed</dt><dd>Accessed {source.accessedAt}</dd></div>
        <div><dt>Last checked</dt><dd>Last checked {source.lastCheckedAt}</dd></div>
        {source.linkedContentBlock ? <div><dt>Linked content</dt><dd>Linked content: {source.linkedContentBlock}</dd></div> : null}
      </dl>
      <a className="inline-link" href={source.url} rel="noreferrer" target="_blank">
        Open source URL <ExternalLink />
      </a>
    </article>
  );
}

function HistoricalMediaSection({ place }: { place: PlaceTrustRecord }) {
  const currentMedia = getApprovedCurrentMedia(place);
  const historicalMedia = getApprovedHistoricalMedia(place);

  return (
    <section className="trust-card">
      <span className="eyebrow">Historical media</span>
      <h2>Approved media</h2>
      <div className="trust-grid">
        <MediaGroup label={`Current media for ${displayName(place.name)}`} title="Approved current media" media={currentMedia} emptyState="No approved current media yet." />
        <MediaGroup label={`Historical media for ${displayName(place.name)}`} title="Approved historical media" media={historicalMedia} emptyState="No approved historical media yet." />
      </div>
    </section>
  );
}

function ThenNowModule({ place }: { place: PlaceTrustRecord }) {
  const pair = getThenNowPair(place);

  return (
    <section className="trust-card" aria-label={`Then and now comparison for ${displayName(place.name)}`}>
      <span className="eyebrow">Then-now comparison</span>
      <h2>Then and now</h2>
      {pair.hasPair && pair.thenMedia && pair.nowMedia ? (
        <div className="then-now-grid">
          <MediaFigure label="Then" media={pair.thenMedia} />
          <MediaFigure label="Now" media={pair.nowMedia} />
        </div>
      ) : (
        <div className="empty-state">
          <AlertTriangle />
          <p>{pair.emptyState}</p>
        </div>
      )}
    </section>
  );
}

function MediaGroup({ emptyState, label, media, title }: { emptyState: string; label: string; media: PlaceMedia[]; title: string }) {
  return (
    <section aria-label={label} className="media-group">
      <h3>{title}</h3>
      {media.length ? (
        <div className="media-list">
          {media.map((item) => <MediaFigure key={item.id} media={item} />)}
        </div>
      ) : (
        <p className="empty-copy">{emptyState}</p>
      )}
    </section>
  );
}

function MediaFigure({ label, media }: { label?: string; media: PlaceMedia }) {
  return (
    <figure className="media-figure">
      <div className="media-placeholder" role="img" aria-label={media.alt}>
        <Image />
        {label ? <span>{label}</span> : null}
      </div>
      <figcaption>
        <strong>{media.title}</strong>
        <span>{media.publisher}</span>
        <span>{media.license}</span>
        <span>{media.attribution}</span>
        <a href={media.sourceUrl} rel="noreferrer" target="_blank">Open media source</a>
      </figcaption>
    </figure>
  );
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <section className="trust-card metric-card" aria-label={label}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}

function TrustBadge({ children, icon, tone }: { children: ReactNode; icon: ReactNode; tone: 'good' | 'review' | 'neutral' }) {
  return <span className={`trust-badge ${tone}`}>{icon}{children}</span>;
}

function displayName(name: string): string {
  return name;
}
