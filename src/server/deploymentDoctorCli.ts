import 'dotenv/config';
import { runDeploymentDoctor } from './deploymentDoctor';
import { formatDoctorStatus } from './deploymentDoctorCliFormat';

function apiBaseUrlFromEnv() {
  if (process.env.DOCTOR_API_BASE_URL) return process.env.DOCTOR_API_BASE_URL;

  const port = process.env.API_PORT || '5174';
  return `http://127.0.0.1:${port}`;
}

const result = await runDeploymentDoctor({
  apiBaseUrl: apiBaseUrlFromEnv(),
  publicBaseUrl: process.env.DOCTOR_PUBLIC_BASE_URL,
  env: process.env,
});

console.log(`Deployment doctor for ${result.apiBaseUrl}`);
if (result.publicBaseUrl) console.log(`Public frontend ${result.publicBaseUrl}`);
console.log(`Checked at ${result.checkedAt}`);

for (const check of result.checks) {
  console.log(`[${formatDoctorStatus(check.status)}] ${check.label}: ${check.message}`);
  check.details?.forEach((detail) => console.log(`  Detail: ${detail}`));
  if (check.action) console.log(`  Action: ${check.action}`);
}

process.exitCode = result.ok ? 0 : 1;
