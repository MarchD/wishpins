import { CSSProperties, MouseEvent } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Box, Link as MuiLink, Typography } from '@mui/material';
import type { WishItem } from '../types';

interface StickyCardProps {
  item: WishItem;
}

export const StickyCard = ({ item }: StickyCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 10 : 1,
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

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onCardClick}
      sx={{
        cursor: 'grab',
        userSelect: 'none',
        background: 'linear-gradient(160deg, #fff8b0 0%, #f7ef90 100%)',
        borderRadius: 2,
        p: 1.5,
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        minHeight: 88,
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
            maxHeight: 96,
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
