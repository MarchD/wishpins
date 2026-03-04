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

  const data = (await response.json()) as unknown;
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

  const result = (await response.json()) as Record<string, unknown>;
  if (result.ok !== true) {
    throw new Error(String(result.error ?? 'Unknown update error'));
  }
};
