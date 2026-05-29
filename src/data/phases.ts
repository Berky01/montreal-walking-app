export const phases = [
  {
    name: 'Market and competitor audit',
    gate: 'Keep the wedge unless 3+ competitors already solve steps + pleasant city loops well.',
    state: 'Active',
  },
  {
    name: 'Customer validation',
    gate: '40% monthly intent, 20% weekly intent, 5 early-access requests, 3 payment signals.',
    state: 'Not started',
  },
  {
    name: 'Concierge route test',
    gate: '50% complete or seriously plan a walk, 30% request another route.',
    state: 'Not started',
  },
  {
    name: 'Fake-door MVP',
    gate: '10-20% email conversion, 25% generate-click intent, repeat requests.',
    state: 'Ready to test',
  },
  {
    name: 'Web MVP',
    gate: 'Build only after prior gates pass; keep automation lightweight.',
    state: 'Blocked by evidence',
  },
];
