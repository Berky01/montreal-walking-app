export async function fetchWithTimeout(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutRejection = new Promise<Response>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(timeoutMessage));
      controller.abort();
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      fetcher(input, { ...init, signal: controller.signal }),
      timeoutRejection,
    ]);
  } finally {
    clearTimeout(timeout!);
  }
}
