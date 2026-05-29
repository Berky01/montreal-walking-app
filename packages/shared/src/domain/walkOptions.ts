export const supportedMoods = ['calm', 'scenic', 'historic', 'coffee', 'green', 'energetic'] as const;

export const interestOptions = [
  { id: 'parks', label: 'Parks' },
  { id: 'cafes', label: 'Cafés' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'churches', label: 'Churches' },
  { id: 'viewpoints', label: 'Viewpoints' },
  { id: 'waterfront', label: 'Waterfront' },
  { id: 'public-toilets', label: 'Public toilets' },
  { id: 'transit', label: 'Transit access' },
] as const;

export const supportedInterests = interestOptions.map((option) => option.id);
