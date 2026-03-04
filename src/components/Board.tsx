import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import type { WishItem } from '../types';
import { StickyCard } from './StickyCard';

interface BoardProps {
  items: WishItem[];
}

export const TODO_ZONE_ID = 'todo';
export const IN_PROGRESS_DONE_ZONE_ID = 'in_progress_done';

const CanvasZone = ({
  id,
  title,
  sx
}: {
  id: string;
  title: string;
  sx: Record<string, unknown>;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      data-zone-id={id}
      sx={{
        position: 'absolute',
        borderRadius: 3,
        border: isOver ? '3px solid rgba(33, 150, 243, 0.72)' : '2px dashed rgba(0, 0, 0, 0.28)',
        bgcolor: isOver ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
        transition: 'all 140ms ease',
        p: 1.5,
        ...sx
      }}
    >
      <Typography fontWeight={900} fontSize={14} letterSpacing={0.6} color="rgba(39, 24, 12, 0.85)">
        {title}
      </Typography>
    </Box>
  );
};

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
      <CanvasZone id={TODO_ZONE_ID} title="TODO" sx={{ top: 16, left: 16, bottom: 16, width: '32%' }} />

      <CanvasZone
        id={IN_PROGRESS_DONE_ZONE_ID}
        title="IN PROGRESS / DONE"
        sx={{ top: 16, left: '34%', right: 16, bottom: 16 }}
      />

      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sortedItems.map((item) => (
          <StickyCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};
