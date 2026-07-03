import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaceTrustPage } from './PlaceTrustPage';

describe('PlaceTrustPage', () => {
  it("renders the Place d'Armes source drawer trigger and trust badges", () => {
    render(<PlaceTrustPage slug="place-darmes" />);

    expect(screen.getByRole('heading', { name: "Place d'Armes" })).toBeInTheDocument();
    expect(screen.getAllByText('Verified').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Source quality 94/100')).toBeInTheDocument();
    expect(screen.getByText('Last reviewed 2026-07-02')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open source drawer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report correction/i })).toHaveAttribute('href', '/report-issue?place=place-darmes');
  });

  it('renders the Notre-Dame Basilica source drawer trigger', () => {
    render(<PlaceTrustPage slug="notre-dame-basilica" />);

    expect(screen.getByRole('heading', { name: 'Notre-Dame Basilica' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open source drawer/i })).toBeInTheDocument();
  });

  it('renders a Needs review state for lower quality POIs', () => {
    render(<PlaceTrustPage slug="saint-joseph-oratory" />);

    expect(screen.getByText('Needs review')).toBeInTheDocument();
    expect(screen.getByText('Source quality 62/100')).toBeInTheDocument();
  });

  it('renders source drawer details with title, publisher, license, reliability, dates, and linked content', () => {
    render(<PlaceTrustPage slug="place-darmes" />);

    const drawer = screen.getByLabelText("Source drawer for Place d'Armes");
    expect(within(drawer).getByText('Meaningful Routes editorial review')).toBeInTheDocument();
    expect(within(drawer).getByText('Editorial')).toBeInTheDocument();
    expect(within(drawer).getByText('Meaningful Routes')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /Open source URL/i })).toHaveAttribute('href', 'https://example.com/sources/place-darmes');
    expect(within(drawer).getByText('License: Internal editorial notes')).toBeInTheDocument();
    expect(within(drawer).getByText('Reliability: Verified')).toBeInTheDocument();
    expect(within(drawer).getByText('Accessed 2026-07-02')).toBeInTheDocument();
    expect(within(drawer).getByText(/Linked content: Why it matters/)).toBeInTheDocument();
  });

  it('renders approved media attribution under current and historical media', () => {
    render(<PlaceTrustPage slug="place-darmes" />);

    const historical = screen.getByLabelText("Historical media for Place d'Armes");
    expect(within(historical).getByText("Place d'Armes, circa 1870")).toBeInTheDocument();
    expect(within(historical).getAllByText(/Public domain archive/).length).toBeGreaterThanOrEqual(1);

    const current = screen.getByLabelText("Current media for Place d'Armes");
    expect(within(current).getByText("Place d'Armes current view")).toBeInTheDocument();
    expect(within(current).getAllByText(/Wikimedia Commons/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders historical media and then-now empty states without historical data', () => {
    render(<PlaceTrustPage slug="saint-joseph-oratory" />);

    expect(screen.getByText('No approved historical media yet.')).toBeInTheDocument();
    expect(screen.getByText('No verified historical comparison yet.')).toBeInTheDocument();
  });

  it('renders a paired then-now module when paired media exists', () => {
    render(<PlaceTrustPage slug="place-darmes" />);

    const comparison = screen.getByLabelText("Then and now comparison for Place d'Armes");
    expect(within(comparison).getByText('Then')).toBeInTheDocument();
    expect(within(comparison).getByText('Now')).toBeInTheDocument();
    expect(within(comparison).getByText("Place d'Armes, circa 1870")).toBeInTheDocument();
    expect(within(comparison).getByText("Place d'Armes current view")).toBeInTheDocument();
  });
});
