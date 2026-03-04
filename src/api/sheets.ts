import type { UpdateWishPayload, WishItem, WishStatus } from '../types';

const baseUrl = import.meta.env.VITE_SHEETS_API_URL as string | undefined;
const proxyBase = import.meta.env.VITE_PROXY_API_BASE as string | undefined;
const isDev = import.meta.env.DEV;

const toStatus = (value: unknown): WishStatus => {
  if (value === 'todo' || value === 'in_progress' || value === 'done') {
    return value;
  }
  return 'todo';
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeItem = (value: unknown): WishItem => {
  const record = (value ?? {}) as Record<string, unknown>;

  return {
    id: String(record.id ?? ''),
    title: String(record.title ?? ''),
    link: record.link ? String(record.link) : undefined,
    image: record.image ? String(record.image) : undefined,
    status: toStatus(record.status),
    x: toOptionalNumber(record.x),
    y: toOptionalNumber(record.y),
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined
  };
};


const snippetOf = (value: string): string => value.trim().slice(0, 180);

const tryParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return undefined;
  }
};

const parseJsonPayload = (raw: string): unknown => {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error('Empty API response.');
  }

  const direct = tryParse(trimmed);
  if (direct !== undefined) {
    return direct;
  }

  const starts = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((idx) => idx >= 0);
  if (starts.length === 0) {
    throw new Error(
      `API returned non-JSON content (likely Google HTML/CORS interstitial). Snippet: ${snippetOf(trimmed)}`
    );
  }

  const start = Math.min(...starts);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));

  if (end <= start) {
    throw new Error('API returned malformed JSON payload.');
  }

  const candidate = trimmed.slice(start, end + 1);
  const parsedCandidate = tryParse(candidate);
  if (parsedCandidate !== undefined) {
    return parsedCandidate;
  }

  throw new Error(`API returned malformed JSON payload. Snippet: ${snippetOf(candidate)}`);
};

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const raw = await response.text();
  return parseJsonPayload(raw);
};

const ensureConfigured = () => {
  if (!isDev && !proxyBase && !baseUrl) {
    throw new Error(
      'Missing API config. Set VITE_PROXY_API_BASE (recommended) or VITE_SHEETS_API_URL in .env.'
    );
  }

  if (isDev && !baseUrl) {
    throw new Error('Missing API config. Set VITE_SHEETS_API_URL in .env for local proxy target.');
  }
};

const endpoint = (action: 'items' | 'update') => {
  ensureConfigured();
  if (isDev) {
    return `/api?action=${action}`;
  }

  if (proxyBase) {
    const root = proxyBase.replace(/\/+$/, '');
    return `${root}?action=${action}`;
  }

  const root = baseUrl!.replace(/\/+$/, '');
  return `${root}?action=${action}`;
};

export const fetchItems = async (): Promise<WishItem[]> => {
  const response = await fetch(endpoint('items'), {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`Failed to load items (${response.status})`);
  }

  const data = await parseJsonResponse(response);
  if (!Array.isArray(data)) {
    throw new Error('Invalid API response: expected array of items.');
  }

  return data
    .map(normalizeItem)
    .filter((item) => item.id.trim().length > 0 && item.title.trim().length > 0);
};

export const updateItem = async (payload: UpdateWishPayload): Promise<void> => {
  const response = await fetch(endpoint('update'), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to update item (${response.status})`);
  }

  const result = (await parseJsonResponse(response)) as Record<string, unknown>;
  if (result.ok !== true) {
    throw new Error(String(result.error ?? 'Unknown update error'));
  }
};
