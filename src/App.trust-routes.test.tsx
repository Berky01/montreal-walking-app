import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { trustedLiveRoutes } from './data/placeTrustData';

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

afterEach(() => {
  window.history.pushState({}, '', '/');
});

describe('source trust SPA routes', () => {
  it('routes /places/place-darmes to the POI trust page', () => {
    renderAt('/places/place-darmes');

    expect(screen.getByRole('heading', { name: "Place d'Armes" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open source drawer/i })).toBeInTheDocument();
    expect(screen.getByText('No public device, offline pack, or partner dashboard features are enabled.')).toBeInTheDocument();
  });

  it('gates /admin/route-qa unless admin QA is explicitly enabled', () => {
    renderAt('/admin/route-qa');

    expect(screen.getByRole('heading', { name: 'Admin source QA is disabled' })).toBeInTheDocument();
    expect(screen.queryByText('Source QA queue')).not.toBeInTheDocument();
  });

  it('renders gated admin source QA with source counts when enabled by query param', () => {
    renderAt('/admin/route-qa?admin=1');

    expect(screen.getByRole('heading', { name: 'Source QA queue' })).toBeInTheDocument();
    expect(screen.getByText('Place source records')).toBeInTheDocument();
    expect(screen.getByText('Historical media coverage')).toBeInTheDocument();
  });

  it('renders steps, pace, current stop, and source review text for every live route page', () => {
    for (const slug of Object.keys(trustedLiveRoutes)) {
      const { unmount } = renderAt(`/routes/${slug}/live`);
      const main = screen.getByRole('main');

      expect(within(main).getByText('Steps')).toBeInTheDocument();
      expect(within(main).getByText('Estimated from planned walking distance')).toBeInTheDocument();
      expect(within(main).getByText('Pace')).toBeInTheDocument();
      expect(within(main).getByText('Current stop context')).toBeInTheDocument();
      expect(within(main).getByText(/Source checked|Needs review|Draft/)).toBeInTheDocument();
      expect(within(main).getByText(/Reviewed \d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
      unmount();
    }
  });
});
