import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isPlaceholderProviderValue } from './envValidation';

interface BootstrapEnvOptions {
  examplePath?: string;
  envPath?: string;
  secretFactory?: (name: string) => string;
}

export interface BootstrapEnvResult {
  changed: boolean;
  created: boolean;
  envPath: string;
  updatedKeys: string[];
  missingProviderKeys: string[];
}

const placeholderValues = new Set([
  '',
  'replace-with-a-long-password',
  'replace-with-a-long-admin-token',
  'change-me',
]);

const generatedSecretKeys = ['POSTGRES_PASSWORD', 'ADMIN_TOKEN'] as const;
const providerKeys = ['MAPTILER_API_KEY', 'MAPBOX_ACCESS_TOKEN', 'GEOAPIFY_API_KEY'] as const;

function defaultSecretFactory() {
  return randomBytes(32).toString('hex');
}

function splitEnvLine(line: string) {
  const separatorIndex = line.indexOf('=');

  if (separatorIndex === -1) return null;

  return {
    key: line.slice(0, separatorIndex),
    value: line.slice(separatorIndex + 1),
  };
}

function replaceEnvValue(contents: string, key: string, value: string) {
  const lines = contents.split(/\r?\n/);
  let replaced = false;
  const nextLines = lines.map((line) => {
    const parsed = splitEnvLine(line);

    if (!parsed || parsed.key !== key) return line;
    replaced = true;
    return `${key}=${value}`;
  });

  if (!replaced) nextLines.push(`${key}=${value}`);
  return nextLines.join('\n');
}

export async function bootstrapEnvFile(options: BootstrapEnvOptions = {}): Promise<BootstrapEnvResult> {
  const examplePath = options.examplePath ?? '.env.example';
  const envPath = options.envPath ?? '.env';
  const secretFactory = options.secretFactory ?? defaultSecretFactory;
  const created = !existsSync(envPath);
  let contents = created
    ? await readFile(examplePath, 'utf8')
    : await readFile(envPath, 'utf8');
  const updatedKeys: string[] = [];

  for (const key of generatedSecretKeys) {
    const currentLine = contents
      .split(/\r?\n/)
      .map(splitEnvLine)
      .find((line) => line?.key === key);
    const currentValue = currentLine?.value.trim() ?? '';

    if (placeholderValues.has(currentValue)) {
      contents = replaceEnvValue(contents, key, secretFactory(key));
      updatedKeys.push(key);
    }
  }

  const envLines = contents
    .split(/\r?\n/)
    .map(splitEnvLine)
    .filter((line): line is { key: string; value: string } => Boolean(line));
  const missingProviderKeys = providerKeys.filter((key) => {
    const currentValue = envLines.find((line) => line.key === key)?.value.trim() ?? '';
    return !currentValue || isPlaceholderProviderValue(currentValue);
  });

  if (created || updatedKeys.length > 0) {
    await writeFile(envPath, contents.endsWith('\n') ? contents : `${contents}\n`);
  }

  return {
    changed: created || updatedKeys.length > 0,
    created,
    envPath,
    updatedKeys,
    missingProviderKeys,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await bootstrapEnvFile();

  if (result.changed) {
    console.log(`${result.created ? 'Created' : 'Updated'} ${result.envPath}.`);
    console.log(`Generated: ${result.updatedKeys.join(', ') || 'none'}.`);
  } else {
    console.log(`${result.envPath} already has non-placeholder local secrets.`);
  }

  if (result.missingProviderKeys.length > 0) {
    console.log(`Missing live provider keys: ${result.missingProviderKeys.join(', ')}.`);
    console.log('Paste MapTiler, Geoapify, and Mapbox keys into .env when ready for live provider checks.');
  } else {
    console.log('Live provider keys are present. Run npm run doctor after starting the API.');
  }
}
