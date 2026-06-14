const sanitizeBaseUrl = (value?: string) => {
  const runtimeDefault = typeof window !== 'undefined' ? window.location.origin : '';
  const base = (value || runtimeDefault).trim();
  return base.replace(/\/+$/, '');
};

export const API_BASE_URL = sanitizeBaseUrl(import.meta.env.VITE_API_URL);

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export async function fetchWithRetry(
  path: string,
  options: RequestInit,
  retries = 2,
  baseDelayMs = 300,
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= retries) {
    try {
      return await fetch(buildApiUrl(path), options);
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const waitMs = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt += 1;
    }
  }

  const cause = lastError instanceof Error && lastError.message ? ` (${lastError.message})` : '';
  const message = `Backend unavailable. Please try again.${cause}`;
  throw new Error(message);
}
