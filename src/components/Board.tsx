import { PointerEvent, WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  width: number;
  height: number;
  onScaleChange?: (scale: number) => void;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max));
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;
const ZOOM_INTENSITY = 0.0015;

export const Board = ({ items, width, height, onScaleChange }: BoardProps) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.id.localeCompare(b.id));
  }, [items]);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startClientY: 0,
    startOffsetX: 0,
    startOffsetY: 0
  });

  const getPanBounds = useCallback(
    (nextScale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      }

      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;

      if (viewportWidth === 0 || viewportHeight === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      }

      const mapWidth = width * nextScale;
      const mapHeight = height * nextScale;

      const centeredX = Math.round((viewportWidth - mapWidth) / 2);
      const centeredY = Math.round((viewportHeight - mapHeight) / 2);

      const minX = mapWidth > viewportWidth ? viewportWidth - mapWidth : centeredX;
      const maxX = mapWidth > viewportWidth ? 0 : centeredX;
      const minY = mapHeight > viewportHeight ? viewportHeight - mapHeight : centeredY;
      const maxY = mapHeight > viewportHeight ? 0 : centeredY;

      return { minX, maxX, minY, maxY };
    },
    [height, width]
  );

  const clampOffset = useCallback(
    (x: number, y: number, nextScale: number) => {
      const bounds = getPanBounds(nextScale);
      return {
        x: clamp(x, bounds.minX, bounds.maxX),
        y: clamp(y, bounds.minY, bounds.maxY)
      };
    },
    [getPanBounds]
  );

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const nextScale = clamp(scale * (1 - event.deltaY * ZOOM_INTENSITY), MIN_SCALE, MAX_SCALE);
    if (nextScale === scale) {
      return;
    }

    const mapX = (cursorX - offset.x) / scale;
    const mapY = (cursorY - offset.y) / scale;

    const nextOffsetX = cursorX - mapX * nextScale;
    const nextOffsetY = cursorY - mapY * nextScale;
    const clamped = clampOffset(nextOffsetX, nextOffsetY, nextScale);

    setScale(nextScale);
    setOffset(clamped);
  };

  const handlePanStart = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-sticky-card="true"]')) {
      return;
    }

    const bounds = getPanBounds(scale);
    if (bounds.minX === bounds.maxX && bounds.minY === bounds.maxY) {
      return;
    }

    panStartRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePanMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPanning || event.pointerId !== panStartRef.current.pointerId) {
      return;
    }

    const deltaX = event.clientX - panStartRef.current.startClientX;
    const deltaY = event.clientY - panStartRef.current.startClientY;
    const next = clampOffset(panStartRef.current.startOffsetX + deltaX, panStartRef.current.startOffsetY + deltaY, scale);
    setOffset(next);
  };

  const handlePanEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!isPanning || event.pointerId !== panStartRef.current.pointerId) {
      return;
    }
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  useEffect(() => {
    onScaleChange?.(scale);
  }, [onScaleChange, scale]);

  useEffect(() => {
    const applyClamp = () => {
      setOffset((current) => clampOffset(current.x, current.y, scale));
    };

    applyClamp();
    window.addEventListener('resize', applyClamp);
    return () => window.removeEventListener('resize', applyClamp);
  }, [clampOffset, scale]);

  return (
    <Box
      ref={viewportRef}
      onWheel={handleWheel}
      onPointerDown={handlePanStart}
      onPointerMove={handlePanMove}
      onPointerUp={handlePanEnd}
      onPointerCancel={handlePanEnd}
      sx={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        cursor: isPanning ? 'grabbing' : 'grab',
        backgroundColor: '#d4a16c',
        backgroundImage:
          'radial-gradient(circle at 1px 2px, rgba(84, 43, 14, 0.33) 1.2px, transparent 1.3px), radial-gradient(circle at 3px 4px, rgba(255, 231, 187, 0.18) 1px, transparent 1.2px), linear-gradient(180deg, #d9a66f 0%, #cb935d 100%)',
        backgroundSize: '10px 10px, 12px 12px, cover'
      }}
    >
      <Box
        id="wishpins-canvas"
        data-map-scale={scale}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: 'top left',
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: 32,
            top: 108,
            width: 479,
            height: 514,
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
    </Box>
  );
};
