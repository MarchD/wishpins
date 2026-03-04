import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import type { WishItem, WishStatus } from '../types';
import { StickyCard } from './StickyCard';

interface BoardProps {
  items: WishItem[];
}

const DroppableColumn = ({
  id,
  title,
  accent,
  items
}: {
  id: WishStatus;
  title: string;
  accent: string;
  items: WishItem[];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        minWidth: 240,
        borderRadius: 2,
        p: 2,
        border: `2px solid ${accent}`,
        bgcolor: isOver ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.86)',
        transition: 'background-color 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2
      }}
    >
      <Typography fontWeight={800} letterSpacing={0.5} color={accent}>
        {title}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, minHeight: 180 }}>
        {items.map((item) => (
          <StickyCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};

export const Board = ({ items }: BoardProps) => {
  const grouped = useMemo(() => {
    return {
      todo: items.filter((item) => item.status === 'todo'),
      in_progress: items.filter((item) => item.status === 'in_progress'),
      done: items.filter((item) => item.status === 'done')
    };
  }, [items]);

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 1.5, md: 2.5 },
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px), radial-gradient(circle at 15% 15%, #ffe6ad 0%, #ffd493 30%, #e4b87a 100%)',
        backgroundSize: '24px 24px, 24px 24px, cover',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 14px 28px rgba(0, 0, 0, 0.18)'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={900}>
            TO DO
          </Typography>
          <DroppableColumn id="todo" title="Items" accent="#fb8c00" items={grouped.todo} />
        </Box>

        <Box sx={{ flex: 2, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={900}>
            IN PROGRESS / DONE
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <DroppableColumn
              id="in_progress"
              title="IN PROGRESS"
              accent="#1e88e5"
              items={grouped.in_progress}
            />
            <DroppableColumn id="done" title="DONE" accent="#43a047" items={grouped.done} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
