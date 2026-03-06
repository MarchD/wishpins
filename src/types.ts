export type WishStatus = 'todo' | 'in_progress' | 'done';

export interface WishItem {
  id: string;
  title: string;
  link?: string;
  image?: string;
  sticker?: string;
  status: WishStatus;
  x?: number;
  y?: number;
  updatedAt?: string;
}

export interface UpdateWishPayload {
  id: string;
  status: WishStatus;
  x?: number;
  y?: number;
  sticker?: string;
}
