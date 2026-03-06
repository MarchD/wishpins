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
import { resolveStickerKey, type StickerKey } from '../stickers';
import type { WishItem } from '../types';

interface StickyCardProps {
  item: WishItem;
}

export const STICKY_WIDTH = 190;
export const STICKY_HEIGHT = 190;

type StickerStyle = {
  src: string;
};

const stickerStyles: Record<StickerKey, StickerStyle> = {
  'group-0': { src: stickerGroup0 },
  'group-1': { src: stickerGroup1 },
  'group-2': { src: stickerGroup2 },
  'group-3': { src: stickerGroup3 },
  'group-4': { src: stickerGroup4 },
  'group-5': { src: stickerGroup5 },
  'group-6': { src: stickerGroup6 }
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

  const stickerKey = resolveStickerKey(item.sticker, item.id);
  const sticker = stickerStyles[stickerKey];

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onCardClick}
      sx={{
        pointerEvents: 'auto',
        isolation: 'isolate',
        position: 'absolute',
        left: item.x ?? 28,
        top: item.y ?? 28,
        width: STICKY_WIDTH,
        minHeight: STICKY_HEIGHT,
        cursor: 'grab',
        userSelect: 'none',
        // Keep sticky note base color and place SVG as a real image layer.
        backgroundColor: 'rgba(255, 248, 176, 0.96)',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        '&:active': { cursor: 'grabbing' }
      }}
      style={style}
    >
      <Box
        component="img"
        src={sticker.src}
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.28)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
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
    </Box>
  );
};
