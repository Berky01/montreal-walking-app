import { createApiClient, resolveApiBaseUrl } from './client';

describe('mobile API client', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the Android emulator host API URL during development when no env URL is set', () => {
    expect(resolveApiBaseUrl('', 'android')).toBe('http://10.0.2.2:5174');
  });

  it('uses the local host API URL for web and iOS development when no env URL is set', () => {
    expect(resolveApiBaseUrl('', 'web')).toBe('http://127.0.0.1:5174');
    expect(resolveApiBaseUrl('', 'ios')).toBe('http://127.0.0.1:5174');
  });

  it('keeps an explicit Expo public API base URL when one is provided', () => {
    expect(resolveApiBaseUrl('http://192.168.1.8:5174/')).toBe('http://192.168.1.8:5174');
  });

  it('builds absolute API URLs and parses JSON responses', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    } as Response);
    const client = createApiClient('http://192.168.1.8:5174');

    await expect(client.get('/api/health/providers')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('http://192.168.1.8:5174/api/health/providers', undefined);
  });

  it('surfaces API error text with the current backend action/fallback fields', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({
        error: 'Route service unavailable.',
        action: 'Restart the API.',
      }),
    } as Response);
    const client = createApiClient('http://api.example.test');

    await expect(client.get('/api/routes/saved')).rejects.toThrow('Route service unavailable. Restart the API.');
  });
});
