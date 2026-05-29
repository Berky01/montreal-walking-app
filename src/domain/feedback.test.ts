import { describe, expect, it } from 'vitest';
import { feedbackOptions, supportedFeedbackLabels } from './feedback';

describe('route feedback contract', () => {
  it('keeps supported feedback labels and displayed options in sync', () => {
    expect(feedbackOptions.map((option) => option.id)).toEqual(supportedFeedbackLabels);
  });
});
