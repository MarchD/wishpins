import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { WishItem } from '../types';
import { StickyCard } from './StickyCard';
import reserveScopeBg from '../assets/stickers/bg.svg';

const STATUS_SCOPE_GEOMETRY = {
  inProgress: {
    left: '6.5%',
    top: '16.5%',
    width: '40.5%',
    height: '68%'
  },
  done: {
    left: '53%',
    top: '16.5%',
    width: '40.5%',
    height: '68%'
  }
} as const;

interface BoardProps {
  items: WishItem[];
}

export const Board = ({ items }: BoardProps) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.id.localeCompare(b.id));
  }, [items]);

  return (
    <Box
      id="wishpins-canvas"
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#d4a16c',
        backgroundImage:
          'radial-gradient(circle at 1px 2px, rgba(84, 43, 14, 0.33) 1.2px, transparent 1.3px), radial-gradient(circle at 3px 4px, rgba(255, 231, 187, 0.18) 1px, transparent 1.2px), linear-gradient(180deg, #d9a66f 0%, #cb935d 100%)',
        backgroundSize: '10px 10px, 12px 12px, cover'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 8, sm: 20, md: 32 },
          top: { xs: 84, sm: 92, md: 108 },
          width: { xs: '72vw', sm: '46vw', md: '34vw' },
          maxWidth: 479,
          minWidth: 220,
          aspectRatio: '479 / 514',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <Box
          component="img"
          src={reserveScopeBg}
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none'
          }}
        />

        <Box
          data-status-scope="in_progress"
          sx={{
            position: 'absolute',
            left: STATUS_SCOPE_GEOMETRY.inProgress.left,
            top: STATUS_SCOPE_GEOMETRY.inProgress.top,
            width: STATUS_SCOPE_GEOMETRY.inProgress.width,
            height: STATUS_SCOPE_GEOMETRY.inProgress.height,
            borderRadius: 6,
            border: '2px dashed rgba(50, 31, 17, 0.48)',
            bgcolor: 'rgba(188, 141, 95, 0.28)'
          }}
        />

        <Box
          data-status-scope="done"
          sx={{
            position: 'absolute',
            left: STATUS_SCOPE_GEOMETRY.done.left,
            top: STATUS_SCOPE_GEOMETRY.done.top,
            width: STATUS_SCOPE_GEOMETRY.done.width,
            height: STATUS_SCOPE_GEOMETRY.done.height,
            borderRadius: 6,
            border: '2px dashed rgba(27, 82, 39, 0.55)',
            bgcolor: 'rgba(109, 167, 119, 0.28)'
          }}
        />
      </Box>

      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sortedItems.map((item) => (
          <StickyCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};
