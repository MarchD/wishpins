import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { WishItem } from '../types';
import { StickyCard } from './StickyCard';

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
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sortedItems.map((item) => (
          <StickyCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};
