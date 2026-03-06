export const STICKER_KEYS = [
  'group-0',
  'group-1',
  'group-2',
  'group-3',
  'group-4',
  'group-5',
  'group-6'
] as const;

export type StickerKey = (typeof STICKER_KEYS)[number];

const STICKER_KEY_SET = new Set<string>(STICKER_KEYS);

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const normalizeStickerKey = (value: unknown): StickerKey | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const key = value.trim();
  if (!STICKER_KEY_SET.has(key)) {
    return undefined;
  }

  return key as StickerKey;
};

export const resolveStickerKey = (value: unknown, itemId: string): StickerKey => {
  const normalized = normalizeStickerKey(value);
  if (normalized) {
    return normalized;
  }

  const index = hashString(itemId) % STICKER_KEYS.length;
  return STICKER_KEYS[index];
};
