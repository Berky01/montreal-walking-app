import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { stitchReviewScreenIds } from './stitchReview';

function mockJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('Stitch review mode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJson({}));
  });

  it('defines every requested Stitch review route exactly once', () => {
    expect(stitchReviewScreenIds).toEqual([
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
    ]);
    expect(new Set(stitchReviewScreenIds).size).toBe(stitchReviewScreenIds.length);
  });

  it.each([
    ['home-goal-first', 'Find a loop that fits today'],
    ['start-location', 'Choose Start Location'],
    ['route-comparison', 'Compare Nearby Loops'],
    ['route-detail-goal-linked', 'Goal-Linked Route'],
    ['poi-card-hook', 'Why Stop Here'],
    ['active-walk-navigation', 'Next Turn'],
    ['no-routes', 'No Matching Routes'],
    ['route-feedback', 'Route Feedback'],
    ['walk-complete', 'Walk Complete'],
    ['saved-progress', 'Saved Discoveries & Progress'],
    ['desktop-planner', 'Route Planner Dashboard'],
    ['desktop-footprint', 'Exploration Footprint'],
  ])('renders %s without using the normal API flow', async (screenId, heading) => {
    window.history.pushState({}, '', `/?stitchScreen=${screenId}`);

    render(<App />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByTestId('stitch-review-screen')).toHaveAttribute('data-screen', screenId);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
