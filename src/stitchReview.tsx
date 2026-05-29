import {
  ArrowLeft,
  Bookmark,
  Check,
  Coffee,
  Compass,
  Flag,
  Footprints,
  Leaf,
  MapPin,
  Navigation,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { RouteMap } from './components/RouteMap';
import type { CompletedWalkSummary, ProgressSummary, RouteSummary, SavedRouteRecord, ScoredRoute } from './domain/mvpTypes';

export const stitchReviewScreenIds = [
  'home',
  'home-goal-first',
  'start-location',
  'route-comparison',
  'route-detail',
  'route-detail-goal-linked',
  'poi-card',
  'poi-card-practical',
  'poi-card-hook',
  'active-walk',
  'active-walk-navigation',
  'active-walk-progress',
  'active-walk-streamlined',
  'active-walk-variants',
  'no-routes',
  'route-feedback',
  'walk-complete',
  'walk-complete-summary',
  'saved-progress',
  'desktop-home',
  'desktop-planner',
  'desktop-detail',
  'desktop-footprint',
] as const;

export type StitchReviewScreenId = typeof stitchReviewScreenIds[number];

const stitchReviewScreenSet = new Set<string>(stitchReviewScreenIds);

const fixtureRoute: ScoredRoute = {
  id: 'stitch-route-mile-end',
  label: 'Mile End Practical Loop',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.5261, lng: -73.6024 },
    { lat: 45.5274, lng: -73.5968 },
    { lat: 45.5245, lng: -73.5926 },
    { lat: 45.5234, lng: -73.5996 },
  ],
  pois: [
    {
      id: 'stitch-cafe',
      cityId: 'montreal',
      name: 'Cafe Olimpico',
      category: 'cafes',
      coordinate: { lat: 45.5261, lng: -73.6024 },
      source: 'curated',
      moods: ['coffee'],
      interestTags: ['cafes'],
      computedRouteValue: 95,
      lastImportedAt: '2026-05-27T00:00:00.000Z',
    },
    {
      id: 'stitch-park',
      cityId: 'montreal',
      name: 'Parc Lahaie',
      category: 'parks',
      coordinate: { lat: 45.5274, lng: -73.5968 },
      source: 'curated',
      moods: ['green'],
      interestTags: ['parks'],
      computedRouteValue: 88,
      lastImportedAt: '2026-05-27T00:00:00.000Z',
    },
    {
      id: 'stitch-architecture',
      cityId: 'montreal',
      name: 'Fairmount facade row',
      category: 'architecture',
      coordinate: { lat: 45.5245, lng: -73.5926 },
      source: 'curated',
      moods: ['historic'],
      interestTags: ['architecture'],
      computedRouteValue: 82,
      lastImportedAt: '2026-05-27T00:00:00.000Z',
    },
  ],
  distanceMeters: 3200,
  durationSeconds: 2340,
  estimatedSteps: 4260,
  provider: 'stitch-review',
  debug: { targetMeters: 3200, waypointStrategy: 'stitch review' },
  score: {
    total: 92,
    breakdown: {
      stepFit: 94,
      timeFit: 90,
      moodMatch: 88,
      interestMatch: 96,
      poiSpacing: 86,
      detourPenalty: 0,
      parkWaterfrontBonus: 6,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'A compact loop with practical stops, a green midpoint, and a clear return toward Mile End.',
  scoreSummary: ['94/100 step fit', '96/100 interest fit'],
  exportLinks: {
    googleMaps: 'https://maps.google.com/?api=1',
    gpx: '<gpx></gpx>',
  },
};

const alternateRoutes: RouteSummary[] = [
  {
    id: 'stitch-route-mile-end',
    label: 'Mile End Practical Loop',
    explanation: 'Best fit for a 30 minute walk with useful stops close to the start.',
    estimatedSteps: 4260,
    durationSeconds: 2340,
    distanceMeters: 3200,
    poiCount: 3,
  },
  {
    id: 'stitch-route-green',
    label: 'Park and Cafe Thread',
    explanation: 'Softer pace with a green midpoint and one coffee stop.',
    estimatedSteps: 3880,
    durationSeconds: 2100,
    distanceMeters: 2900,
    poiCount: 2,
  },
  {
    id: 'stitch-route-architecture',
    label: 'Facade Detail Loop',
    explanation: 'A slightly longer loop with more street-level visual details.',
    estimatedSteps: 5100,
    durationSeconds: 2820,
    distanceMeters: 3800,
    poiCount: 4,
  },
];

const reviewProgress: ProgressSummary = {
  profileId: 'local',
  cityId: 'montreal',
  placesDiscovered: 28,
  loopsCompleted: 9,
  savedRoutes: 4,
  estimatedNeighborhoodCoverage: 46,
  savedDiscoveries: [],
};

const savedRoute: SavedRouteRecord = {
  id: 'saved-stitch-route',
  profileId: 'local',
  routeId: fixtureRoute.id,
  route: fixtureRoute,
  createdAt: '2026-05-27T12:00:00.000Z',
};

const completedWalk: CompletedWalkSummary = {
  id: 'walk-stitch-1',
  routeId: fixtureRoute.id,
  routeLabel: fixtureRoute.label,
  status: 'completed',
  startedAt: '2026-05-27T11:00:00.000Z',
  completedAt: '2026-05-27T11:39:00.000Z',
  elapsedSeconds: 2340,
  estimatedSteps: 4260,
  discoveredCount: 3,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-CA').format(Math.round(value));
}

function humanDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function routeFitLabel(category: RouteSummary['fitCategory']) {
  if (category === 'best-fit') return 'Best match';
  if (category === 'shorter') return 'Shorter';
  if (category === 'scenic') return 'Scenic';
  if (category === 'fewer-stops') return 'Simpler';
  return 'Route';
}

function activeReviewScreen(): StitchReviewScreenId | null {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get('stitchScreen');
  return screen && stitchReviewScreenSet.has(screen) ? screen as StitchReviewScreenId : null;
}

export function getActiveStitchReviewScreen() {
  return activeReviewScreen();
}

function ReviewHeader({ title = 'Montreal Loop Scout', detail = 'Plateau Mont-Royal' }: { title?: string; detail?: string }) {
  return (
    <header className="stitch-app-header">
      <button className="icon-button soft" type="button" aria-label="Back">
        <ArrowLeft />
      </button>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <button className="icon-button soft" type="button" aria-label="Saved discoveries">
        <Bookmark />
      </button>
    </header>
  );
}

function MetricRow({ route = fixtureRoute }: { route?: ScoredRoute | RouteSummary }) {
  return (
    <div className="route-facts stitch-data-row">
      <span>{Math.round(route.durationSeconds / 60)} min</span>
      <span>{formatNumber(route.estimatedSteps)} steps</span>
      <span>{humanDistance(route.distanceMeters)}</span>
      <span>{'pois' in route ? route.pois.length : route.poiCount} stops</span>
    </div>
  );
}

function GoalPlanner({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? 'stitch-planner compact' : 'stitch-planner'}>
      <div className="screen-title">
        <h1>Find a loop that fits today</h1>
        <p>Choose a walking goal, start near Mile End, and compare practical discovery loops.</p>
      </div>
      <label className="start-search" htmlFor="review-start">
        <span>Start near</span>
        <div className="input-row">
          <input id="review-start" defaultValue="Mile End" />
          <button className="icon-button primary" type="button" aria-label="Search start">
            <Search />
          </button>
        </div>
      </label>
      <section className="goal-section">
        <div className="section-heading">
          <h2>Choose a goal</h2>
          <span>4,260 steps · about 39 min</span>
        </div>
        <div className="goal-grid" role="list" aria-label="Walk goals">
          {['30 min', '1 hour', '10k steps', 'Easy loop'].map((goal, index) => (
            <button key={goal} className={index === 0 ? 'goal-card selected' : 'goal-card'} type="button" aria-pressed={index === 0}>
              <span>{goal}</span>
              <strong>{index === 0 ? 'Practical discovery' : index === 1 ? 'One-hour scout' : index === 2 ? 'Big loop' : 'Low-effort nearby'}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="chip-section">
        <h2>Nearby loops</h2>
        <div className="chip-row">
          {([
            ['Parks', Leaf],
            ['Cafes', Coffee],
            ['Architecture', MapPin],
            ['Transit access', Navigation],
          ] as Array<[string, LucideIcon]>).map(([label, Icon], index) => (
            <button key={String(label)} className={index < 2 ? 'interest-chip selected' : 'interest-chip'} type="button" aria-pressed={index < 2}>
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function RouteCards({ title = 'Compare Nearby Loops' }: { title?: string }) {
  return (
    <section className="stitch-route-section">
      <div className="screen-title">
        <h1>{title}</h1>
        <p>Sorted by time fit, stop quality, and a clear return path.</p>
      </div>
      <div className="route-list">
        {alternateRoutes.map((route) => (
          <article key={route.id} className="route-card">
            <div className="route-card-top">
              <span>{route.label}</span>
              <strong>{routeFitLabel(route.fitCategory)}</strong>
            </div>
            <h2>{route.label}</h2>
            <p>{route.fitReason ?? route.explanation}</p>
            <MetricRow route={route} />
          </article>
        ))}
      </div>
    </section>
  );
}

function StopTimeline({ route = fixtureRoute }: { route?: ScoredRoute }) {
  return (
    <section className="poi-sequence stitch-timeline">
      <h2>{route.pois.length} practical stops</h2>
      {route.pois.map((poi, index) => (
        <article key={poi.id} className="poi-row">
          <span className="poi-index">{index + 1}</span>
          <MapPin />
          <div>
            <strong>{poi.name}</strong>
            <small>{poi.category} · useful pause point</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function RouteDetail({ goalLinked = false }: { goalLinked?: boolean }) {
  return (
    <section className="stitch-detail-grid">
      <div className="screen-title">
        <h1>{goalLinked ? 'Goal-Linked Route' : 'Nearby Loops - Detail'}</h1>
        <p>{fixtureRoute.label} · practical discovery directions</p>
      </div>
      <RouteMap route={fixtureRoute} mapTilerKey="" activePoiId="stitch-park" completedPoiIds={goalLinked ? ['stitch-cafe'] : []} />
      <section className="trust-panel">
        <h2>Why this loop</h2>
        <p>{fixtureRoute.explanation}</p>
        <MetricRow />
      </section>
      <StopTimeline />
      <div className="action-grid">
        <button className="primary-button" type="button"><Flag /> Start walk</button>
        <button className="secondary-button" type="button"><Bookmark /> Save</button>
        <button className="secondary-button" type="button"><Share2 /> Share</button>
      </div>
    </section>
  );
}

function POICard({ mode }: { mode: 'plain' | 'practical' | 'hook' }) {
  const title = mode === 'hook' ? 'Why Stop Here' : mode === 'practical' ? 'Practical Discovery' : 'Nearby Loops - POI Card';
  return (
    <section className="screen-stack stitch-single">
      <div className="screen-title">
        <h1>{title}</h1>
        <p>Cafe Olimpico is close enough to keep the route on pace.</p>
      </div>
      <article className="poi-action-card stitch-poi-card">
        <div className="route-card-top">
          <span>Next discovery</span>
          <strong>8 min stop</strong>
        </div>
        <div className="poi-action-title">
          <Coffee />
          <div>
            <h2>Cafe Olimpico</h2>
            <p>{mode === 'hook' ? 'A classic Mile End pause that makes the loop feel local, not random.' : 'Good pause point without turning the walk into an errand.'}</p>
          </div>
        </div>
        <MetricRow />
        <div className="action-grid three">
          <button className="secondary-button" type="button"><Bookmark /> Save</button>
          <button className="secondary-button" type="button">Skip</button>
          <button className="primary-button" type="button"><Check /> Discovered</button>
        </div>
      </article>
    </section>
  );
}

function ActiveWalk({ mode }: { mode: 'default' | 'navigation' | 'progress' | 'streamlined' | 'variants' }) {
  const title = mode === 'navigation' ? 'Next Turn' : mode === 'progress' ? 'Goal Progress' : mode === 'streamlined' ? 'Streamlined Progress' : mode === 'variants' ? 'Active Walk State Variants' : 'Active Walk';
  return (
    <section className="screen-stack active-screen">
      <div className="screen-title">
        <h1>{title}</h1>
        <p>Keep route context visible while walking.</p>
      </div>
      <RouteMap route={fixtureRoute} mapTilerKey="" activePoiId="stitch-park" completedPoiIds={['stitch-cafe']} compact />
      <section className="active-panel">
        <div>
          <span>Estimated route progress</span>
          <strong>1,820 / 4,260 est. steps</strong>
        </div>
        <div className="progress-bar"><span style={{ width: '43%' }} /></div>
        <div>
          <span>Next discovery</span>
          <strong>Parc Lahaie</strong>
        </div>
        <small>Continue two blocks east, then turn toward the park edge.</small>
      </section>
      <section className="tracking-panel">
        <div>
          <span>Live tracking</span>
          <strong>{mode === 'variants' ? 'Paused locally' : 'Local tracking optional'}</strong>
          <small>Location remains local while this walk is active.</small>
        </div>
        <button className="secondary-button" type="button">{mode === 'variants' ? 'Resume tracking' : 'Enable live tracking'}</button>
      </section>
    </section>
  );
}

function Completion({ summary = false }: { summary?: boolean }) {
  return (
    <section className="screen-stack">
      <div className="screen-title">
        <h1>{summary ? 'Walk Complete Summary' : 'Walk Complete'}</h1>
        <p>4,260 estimated steps · 3 discoveries</p>
      </div>
      <section className="complete-panel">
        <Check />
        <strong>31 places discovered</strong>
        <span>10 loops completed</span>
      </section>
      <FeedbackBlock />
    </section>
  );
}

function FeedbackBlock() {
  return (
    <section className="feedback-panel">
      <h2>Route Feedback</h2>
      <div className="chip-row">
        {['Great route', 'Useful stops', 'Too long', 'Too busy'].map((label, index) => (
          <button key={label} className={index < 2 ? 'interest-chip selected' : 'interest-chip'} type="button">
            {label}
          </button>
        ))}
      </div>
      <label className="feedback-note" htmlFor="review-feedback-note">
        Note
        <textarea id="review-feedback-note" defaultValue="Good after-work option." />
      </label>
      <button className="primary-button full" type="button">Save feedback</button>
    </section>
  );
}

function SavedProgress() {
  return (
    <section className="screen-stack">
      <div className="screen-title">
        <h1>Saved Discoveries & Progress</h1>
        <p>Routes, completed loops, and local discovery coverage.</p>
      </div>
      <ProgressPanels />
      <div className="route-list">
        <article className="route-card">
          <h2>{savedRoute.route.label}</h2>
          <MetricRow route={savedRoute.route} />
        </article>
        <article className="route-card">
          <h2>{completedWalk.routeLabel}</h2>
          <div className="route-facts">
            <span>{formatNumber(completedWalk.estimatedSteps)} steps</span>
            <span>{Math.round(completedWalk.elapsedSeconds / 60)} min</span>
            <span>{completedWalk.discoveredCount} discoveries</span>
          </div>
        </article>
      </div>
    </section>
  );
}

function ProgressPanels() {
  return (
    <section className="quiet-progress tall">
      <div><strong>{reviewProgress.placesDiscovered}</strong><span>places discovered</span></div>
      <div><strong>{reviewProgress.loopsCompleted}</strong><span>loops completed</span></div>
      <div><strong>{reviewProgress.estimatedNeighborhoodCoverage}%</strong><span>estimated coverage</span></div>
    </section>
  );
}

function NoRoutes() {
  return (
    <section className="screen-stack">
      <section className="recovery-state">
        <Compass />
        <h1>No Matching Routes</h1>
        <p>Try a shorter goal, fewer interests, or a broader Montreal start point.</p>
        <button className="primary-button full" type="button">Adjust walk</button>
      </section>
    </section>
  );
}

function DesktopShell({ screen }: { screen: StitchReviewScreenId }) {
  const title = screen === 'desktop-planner'
    ? 'Route Planner Dashboard'
    : screen === 'desktop-detail'
      ? 'Route Detail'
      : screen === 'desktop-footprint'
        ? 'Exploration Footprint'
        : 'Home - Goal Discovery';

  return (
    <main className="stitch-review-shell desktop-review" data-testid="stitch-review-screen" data-screen={screen}>
      <ReviewHeader title="Montreal Loop Scout" detail="Desktop review" />
      <section className="stitch-desktop-grid">
        <aside className="desktop-panel">
          <GoalPlanner compact />
        </aside>
        <section className="desktop-main-panel">
          <div className="screen-title">
            <h1>{title}</h1>
            <p>Desktop layout uses planner, map, and progress regions instead of an enlarged phone frame.</p>
          </div>
          {screen === 'desktop-detail' ? <RouteDetail goalLinked /> : <RouteCards title="Recommended Routes" />}
        </section>
        <aside className="desktop-panel">
          <ProgressPanels />
          <StopTimeline />
        </aside>
      </section>
    </main>
  );
}

function ReviewBody({ screen }: { screen: StitchReviewScreenId }) {
  if (screen.startsWith('desktop-')) return <DesktopShell screen={screen} />;

  let body: ReactNode;

  switch (screen) {
    case 'home':
    case 'home-goal-first':
      body = <><GoalPlanner /><RouteCards title="Nearby Loops" /></>;
      break;
    case 'start-location':
      body = <section className="screen-stack stitch-single"><div className="screen-title"><h1>Choose Start Location</h1><p>Search a Montreal neighborhood or point of interest.</p></div><GoalPlanner compact /></section>;
      break;
    case 'route-comparison':
      body = <RouteCards />;
      break;
    case 'route-detail':
      body = <RouteDetail />;
      break;
    case 'route-detail-goal-linked':
      body = <RouteDetail goalLinked />;
      break;
    case 'poi-card':
      body = <POICard mode="plain" />;
      break;
    case 'poi-card-practical':
      body = <POICard mode="practical" />;
      break;
    case 'poi-card-hook':
      body = <POICard mode="hook" />;
      break;
    case 'active-walk':
      body = <ActiveWalk mode="default" />;
      break;
    case 'active-walk-navigation':
      body = <ActiveWalk mode="navigation" />;
      break;
    case 'active-walk-progress':
      body = <ActiveWalk mode="progress" />;
      break;
    case 'active-walk-streamlined':
      body = <ActiveWalk mode="streamlined" />;
      break;
    case 'active-walk-variants':
      body = <ActiveWalk mode="variants" />;
      break;
    case 'no-routes':
      body = <NoRoutes />;
      break;
    case 'route-feedback':
      body = <section className="screen-stack stitch-single"><FeedbackBlock /></section>;
      break;
    case 'walk-complete':
      body = <Completion />;
      break;
    case 'walk-complete-summary':
      body = <Completion summary />;
      break;
    case 'saved-progress':
      body = <SavedProgress />;
      break;
    default:
      body = <GoalPlanner />;
      break;
  }

  return (
    <main className="stitch-review-shell" data-testid="stitch-review-screen" data-screen={screen}>
      <section className="mobile-frame stitch-mobile-frame" aria-label="Montreal Loop Scout Stitch review">
        <ReviewHeader title="Plateau Mont-Royal" detail="Mile End" />
        {body}
      </section>
    </main>
  );
}

export function StitchReviewApp() {
  const screen = activeReviewScreen();
  if (!screen) return null;
  return <ReviewBody screen={screen} />;
}
