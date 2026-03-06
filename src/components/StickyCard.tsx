import { CSSProperties, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import stickerGroup0 from '../assets/stickers/sticker-group-0.svg';
import stickerGroup1 from '../assets/stickers/sticker-group-1.svg';
import stickerGroup2 from '../assets/stickers/sticker-group-2.svg';
import stickerGroup3 from '../assets/stickers/sticker-group-3.svg';
import stickerGroup4 from '../assets/stickers/sticker-group-4.svg';
import stickerGroup5 from '../assets/stickers/sticker-group-5.svg';
import stickerGroup6 from '../assets/stickers/sticker-group-6.svg';
import type { WishItem } from '../types';

interface StickyCardProps {
  item: WishItem;
}

export const STICKY_WIDTH = 190;
export const STICKY_HEIGHT = 190;

const stickerVariants = [
  stickerGroup0,
  stickerGroup1,
  stickerGroup2,
  stickerGroup3,
  stickerGroup4,
  stickerGroup5,
  stickerGroup6
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const stickerForItem = (itemId: string): string => {
  const index = hashString(itemId) % stickerVariants.length;
  return stickerVariants[index];
};

export const StickyCard = ({ item }: StickyCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 20 : 2,
    opacity: isDragging ? 0.85 : 1,
    touchAction: 'none'
  };

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  const onCardClick = () => {
    if (item.link && !isDragging) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  const sticker = stickerForItem(item.id);

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onCardClick}
      sx={{
        pointerEvents: 'auto',
        position: 'absolute',
        left: item.x ?? 28,
        top: item.y ?? 28,
        width: STICKY_WIDTH,
        minHeight: STICKY_HEIGHT,
        cursor: 'grab',
        userSelect: 'none',
        // Keep text readable while using the sticker art as the full card background.
        backgroundImage: `linear-gradient(0deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.38)), url(${sticker})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: 2,
        overflow: 'hidden',
        p: 1.5,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        '&:active': { cursor: 'grabbing' }
      }}
      style={style}
    >
      <Typography fontWeight={700} lineHeight={1.2} color="rgba(24, 24, 24, 0.95)">
        {item.title}
      </Typography>

      {item.image ? (
        <Box
          component="img"
          src={item.image}
          alt={item.title}
          sx={{
            width: '100%',
            maxHeight: 82,
            objectFit: 'cover',
            borderRadius: 1,
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        />
      ) : null}

      {item.link ? (
        <MuiLink
          href={item.link}
          target="_blank"
          rel="noreferrer"
          underline="hover"
          fontSize={13}
          onClick={onLinkClick}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'rgba(17, 24, 39, 0.9)'
          }}
        >
          Open link
        </MuiLink>
      ) : null}
    </Box>
  );
};
