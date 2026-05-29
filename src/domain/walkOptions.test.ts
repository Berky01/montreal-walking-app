import { describe, expect, it } from 'vitest';
import {
  interestOptions,
  supportedInterests,
  supportedMoods,
} from './walkOptions';

describe('walk option contract', () => {
  it('keeps supported interests and displayed interest options in sync', () => {
    expect(interestOptions.map((option) => option.id)).toEqual(supportedInterests);
  });

  it('keeps MVP mood options explicit and ordered for forms and API validation', () => {
    expect(supportedMoods).toEqual(['calm', 'scenic', 'historic', 'coffee', 'green', 'energetic']);
  });
});
