import type { DoctorStatus } from './deploymentDoctor';

export function formatDoctorStatus(status: DoctorStatus) {
  if (status === 'ok') return 'OK';
  if (status === 'warn') return 'WARN';
  if (status === 'skip') return 'SKIP';
  return 'FAIL';
}
