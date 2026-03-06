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

export type StickerTextLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  align: 'left' | 'center';
  titleSize: number;
  titleLines: number;
  linkSize: number;
  linkOffsetTop: number;
};

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

export const stickerTextLayoutByKey: Record<StickerKey, StickerTextLayout> = {
  // Tall note with uneven top edge.
  'group-0': {
    x: 18,
    y: 16,
    width: 64,
    height: 32,
    align: 'center',
    titleSize: 14,
    titleLines: 2,
    linkSize: 12,
    linkOffsetTop: 6
  },
  // Spiral notebook shape.
  'group-1': {
    x: 10,
    y: 22,
    width: 80,
    height: 30,
    align: 'center',
    titleSize: 16,
    titleLines: 2,
    linkSize: 12,
    linkOffsetTop: 8
  },
  // Narrow tall note.
  'group-2': {
    x: 14,
    y: 17,
    width: 72,
    height: 32,
    align: 'center',
    titleSize: 15,
    titleLines: 2,
    linkSize: 12,
    linkOffsetTop: 7
  },
  // Smaller sticker shape.
  'group-3': {
    x: 16,
    y: 18,
    width: 68,
    height: 30,
    align: 'center',
    titleSize: 14,
    titleLines: 2,
    linkSize: 11,
    linkOffsetTop: 6
  },
  // Compact square-ish sticker.
  'group-4': {
    x: 16,
    y: 19,
    width: 68,
    height: 28,
    align: 'center',
    titleSize: 14,
    titleLines: 2,
    linkSize: 11,
    linkOffsetTop: 6
  },
  // Wide note.
  'group-5': {
    x: 9,
    y: 16,
    width: 82,
    height: 30,
    align: 'center',
    titleSize: 15,
    titleLines: 2,
    linkSize: 12,
    linkOffsetTop: 6
  },
  // Rounded sticker.
  'group-6': {
    x: 13,
    y: 18,
    width: 74,
    height: 30,
    align: 'center',
    titleSize: 15,
    titleLines: 2,
    linkSize: 12,
    linkOffsetTop: 6
  }
};
