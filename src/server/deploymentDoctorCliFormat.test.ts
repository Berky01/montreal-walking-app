import { describe, expect, it } from 'vitest';
import { formatDoctorStatus } from './deploymentDoctorCliFormat';

describe('deployment doctor CLI formatting', () => {
  it('prints warning checks as warnings instead of failures', () => {
    expect(formatDoctorStatus('warn')).toBe('WARN');
  });
});
