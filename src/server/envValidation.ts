const providerPlaceholderFragments = ['replace-with', 'your-', '-here'];

export function isPlaceholderProviderValue(value: string) {
  const normalized = value.trim().toLowerCase();

  return providerPlaceholderFragments.some((fragment) => normalized.includes(fragment));
}

export function usableProviderEnvValue(env: Record<string, string | undefined>, name: string) {
  const value = env[name]?.trim() ?? '';

  return value && !isPlaceholderProviderValue(value) ? value : '';
}
