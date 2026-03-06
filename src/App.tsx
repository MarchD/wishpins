import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { fetchItems, updateItem } from './api/sheets';
import { Board, IN_PROGRESS_DONE_ZONE_ID, TODO_ZONE_ID } from './components/Board';
import { STICKY_HEIGHT, STICKY_WIDTH } from './components/StickyCard';
import { resolveStickerKey } from './stickers';
import type { WishItem, WishStatus } from './types';

const App = () => {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await fetchItems();
      setItems(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const itemById = useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const persistItemPlacement = useCallback(
    async ({
      itemId,
      nextStatus,
      previousStatus,
      x,
      y,
      previousX,
      previousY
    }: {
      itemId: string;
      nextStatus: WishStatus;
      previousStatus: WishStatus;
      x: number;
      y: number;
      previousX?: number;
      previousY?: number;
    }) => {
      const nowIso = new Date().toISOString();

      setSavingIds((current) => {
        const updated = new Set(current);
        updated.add(itemId);
        return updated;
      });

      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: nextStatus,
                x,
                y,
                updatedAt: nowIso
              }
            : item
        )
      );

      try {
        const item = itemById.get(itemId);
        await updateItem({
          id: itemId,
          status: nextStatus,
          x,
          y,
          sticker: item ? resolveStickerKey(item.sticker, item.id) : undefined
        });
      } catch (err) {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: previousStatus,
                  x: previousX,
                  y: previousY
                }
              : item
          )
        );
        setToast(err instanceof Error ? `Save failed: ${err.message}` : 'Save failed');
      } finally {
        setSavingIds((current) => {
          const updated = new Set(current);
          updated.delete(itemId);
          return updated;
        });
      }
    },
    [itemById]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const destination = String(event.over?.id ?? '');
    if (destination !== TODO_ZONE_ID && destination !== IN_PROGRESS_DONE_ZONE_ID) {
      return;
    }

    const id = String(event.active.id);
    const item = itemById.get(id);
    if (!item || savingIds.has(id)) {
      return;
    }

    const canvas = document.getElementById('wishpins-canvas');
    if (!canvas) {
      return;
    }

    const nextStatus: WishStatus =
      destination === TODO_ZONE_ID ? 'todo' : item.status === 'done' ? 'done' : 'in_progress';

    const canvasRect = canvas.getBoundingClientRect();
    const itemRect = event.active.rect.current.initial ?? event.active.rect.current.translated;
    if (!itemRect) {
      return;
    }

    const rawLeft = itemRect.left + event.delta.x - canvasRect.left;
    const rawTop = itemRect.top + event.delta.y - canvasRect.top;

    const clampedX = Math.max(8, Math.min(rawLeft, canvasRect.width - STICKY_WIDTH - 8));
    const clampedY = Math.max(8, Math.min(rawTop, canvasRect.height - STICKY_HEIGHT - 8));

    void persistItemPlacement({
      itemId: id,
      nextStatus,
      previousStatus: item.status,
      x: clampedX,
      y: clampedY,
      previousX: item.x,
      previousY: item.y
    });
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          zIndex: 30,
          top: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Typography variant="h5" fontWeight={900} color="rgba(39, 24, 12, 0.9)">
          WishPins
        </Typography>
        <Button variant="contained" onClick={() => void loadItems()} disabled={loading}>
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ width: '100vw', height: '100vh', bgcolor: '#f6f4ef' }} spacing={1}>
          <CircularProgress />
          <Typography color="text.secondary">Loading board...</Typography>
        </Stack>
      ) : error ? (
        <Stack spacing={2} alignItems="flex-start" sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => void loadItems()}>
            Retry
          </Button>
        </Stack>
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <Board items={items} />
        </DndContext>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default App;
