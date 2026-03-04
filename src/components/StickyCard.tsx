import { CSSProperties, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import stickerBolt from '../assets/stickers/sticker-bolt.svg';
import stickerFlower from '../assets/stickers/sticker-flower.svg';
import stickerHeart from '../assets/stickers/sticker-heart.svg';
import stickerStar from '../assets/stickers/sticker-star.svg';
import type { WishItem } from '../types';

interface StickyCardProps {
  item: WishItem;
}

export const STICKY_WIDTH = 190;
export const STICKY_HEIGHT = 190;

const stickerVariants = [stickerFlower, stickerStar, stickerHeart, stickerBolt];

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
        backgroundImage: `linear-gradient(160deg, rgba(255,248,176,0.96) 0%, rgba(247,239,144,0.96) 100%), url(${sticker})`,
        backgroundSize: 'cover, 120px',
        backgroundPosition: 'center, right -8px bottom -8px',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderRadius: 2,
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
      <Typography fontWeight={700} lineHeight={1.2}>
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
            whiteSpace: 'nowrap'
          }}
        >
          Open link
        </MuiLink>
      ) : null}
    </Box>
  );
};
