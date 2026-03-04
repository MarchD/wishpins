import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography } from '@mui/material';
import type { WishItem } from '../types';
import { StickyCard } from './StickyCard';

interface BoardProps {
  items: WishItem[];
}

const TODO_ZONE_ID = 'todo';
const IN_PROGRESS_ZONE_ID = 'in_progress';
const DONE_ZONE_ID = 'done';

const CanvasZone = ({
  id,
  title,
  subtitle,
  sx
}: {
  id: string;
  title: string;
  subtitle?: string;
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
        border: isOver ? '2px solid rgba(33, 150, 243, 0.75)' : '2px dashed rgba(0, 0, 0, 0.2)',
        bgcolor: isOver ? 'rgba(255, 255, 255, 0.44)' : 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(1px)',
        transition: 'all 120ms ease',
        p: 1.5,
        ...sx
      }}
    >
      <Typography fontWeight={900} fontSize={14} letterSpacing={0.6}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary" fontSize={12}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
};

export const Board = ({ items }: BoardProps) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const byStatus = a.status.localeCompare(b.status);
      if (byStatus !== 0) {
        return byStatus;
      }
      return a.id.localeCompare(b.id);
    });
  }, [items]);

  return (
    <Box
      id="wishpins-canvas"
      sx={{
        position: 'relative',
        height: { xs: 560, md: 640 },
        borderRadius: 4,
        overflow: 'hidden',
        p: 2,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.26) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.26) 1px, transparent 1px), radial-gradient(circle at 15% 15%, #ffe6ad 0%, #ffd493 35%, #e4b87a 100%)',
        backgroundSize: '26px 26px, 26px 26px, cover',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 14px 28px rgba(0, 0, 0, 0.18)'
      }}
    >
      <CanvasZone id={TODO_ZONE_ID} title="TO DO" subtitle="Start here" sx={{ top: 16, left: 16, bottom: 16, width: '34%' }} />

      <CanvasZone
        id={IN_PROGRESS_ZONE_ID}
        title="IN PROGRESS"
        subtitle="Working on it"
        sx={{ top: 16, left: '36%', height: '48%', right: 16 }}
      />

      <CanvasZone
        id={DONE_ZONE_ID}
        title="DONE"
        subtitle="Pinned as complete"
        sx={{ top: '52%', left: '36%', bottom: 16, right: 16 }}
      />

      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {sortedItems.map((item) => (
          <StickyCard key={item.id} item={item} />
        ))}
      </Box>
    </Box>
  );
};
