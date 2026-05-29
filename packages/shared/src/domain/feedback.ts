export const feedbackOptions = [
  { id: 'great-route', label: 'Great route' },
  { id: 'boring', label: 'Boring' },
  { id: 'too-long', label: 'Too long' },
  { id: 'too-short', label: 'Too short' },
  { id: 'bad-street', label: 'Bad street' },
  { id: 'bad-poi', label: 'Bad POI' },
  { id: 'would-walk-again', label: 'Would walk again' },
] as const;

export const supportedFeedbackLabels = feedbackOptions.map((option) => option.id);

export type FeedbackLabel = typeof supportedFeedbackLabels[number];
