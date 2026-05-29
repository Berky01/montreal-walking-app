import { describe, expect, it } from 'vitest';
import { stitchTokens } from './stitchTokens';

describe('stitchTokens', () => {
  it('locks the current Stitch design system values', () => {
    expect(stitchTokens.color.primary).toBe('#a43716');
    expect(stitchTokens.color.secondary).toBe('#3c6840');
    expect(stitchTokens.color.background).toBe('#f9f9fc');
    expect(stitchTokens.font.headline).toBe('Hanken Grotesk');
    expect(stitchTokens.font.body).toBe('Public Sans');
    expect(stitchTokens.radius.standard).toBe('4px');
    expect(stitchTokens.radius.large).toBe('8px');
  });
});
