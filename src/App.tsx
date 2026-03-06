import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { fetchItems, updateItem } from './api/sheets';
import { Board } from './components/Board';
import { STICKY_HEIGHT, STICKY_WIDTH } from './components/StickyCard';
import { resolveStickerKey } from './stickers';
import type { UpdateWishPayload, WishItem, WishStatus } from './types';

type PendingSave = {
  payload: UpdateWishPayload;
  rollback: {
    status: WishStatus;
    x?: number;
    y?: number;
  };
};

const SAVE_DEBOUNCE_MS = 350;

const App = () => {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pendingSavesRef = useRef<Map<string, PendingSave>>(new Map());
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inFlightSaveIdsRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    return () => {
      saveTimersRef.current.forEach((timer) => clearTimeout(timer));
      saveTimersRef.current.clear();
    };
  }, []);

  const itemById = useMemo(() => {
    return new Map(items.map((item) => [item.id, item]));
  }, [items]);

  const flushSave = useCallback(
    async (itemId: string) => {
      if (inFlightSaveIdsRef.current.has(itemId)) {
        return;
      }

      const pending = pendingSavesRef.current.get(itemId);
      if (!pending) {
        return;
      }

      pendingSavesRef.current.delete(itemId);
      inFlightSaveIdsRef.current.add(itemId);

      try {
        await updateItem(pending.payload);
      } catch (err) {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: pending.rollback.status,
                  x: pending.rollback.x,
                  y: pending.rollback.y
                }
              : item
          )
        );
        setToast(err instanceof Error ? `Save failed: ${err.message}` : 'Save failed');
      } finally {
        inFlightSaveIdsRef.current.delete(itemId);

        // If user moved the same sticker again during request, flush the latest queued state.
        if (pendingSavesRef.current.has(itemId)) {
          void flushSave(itemId);
        }
      }
    },
    []
  );

  const queueDebouncedSave = useCallback(
    (itemId: string, pending: PendingSave) => {
      pendingSavesRef.current.set(itemId, pending);

      const existingTimer = saveTimersRef.current.get(itemId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        saveTimersRef.current.delete(itemId);
        void flushSave(itemId);
      }, SAVE_DEBOUNCE_MS);

      saveTimersRef.current.set(itemId, timer);
    },
    [flushSave]
  );

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

      const item = itemById.get(itemId);
      queueDebouncedSave(itemId, {
        payload: {
          id: itemId,
          status: nextStatus,
          x,
          y,
          sticker: item ? resolveStickerKey(item.sticker, item.id) : undefined
        },
        rollback: {
          status: previousStatus,
          x: previousX,
          y: previousY
        }
      });
    },
    [itemById, queueDebouncedSave]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const id = String(event.active.id);
    const item = itemById.get(id);
    if (!item) {
      return;
    }

    const canvas = document.getElementById('wishpins-canvas');
    if (!canvas) {
      return;
    }

    const nextStatus: WishStatus = item.status;

    const canvasRect = canvas.getBoundingClientRect();
    const itemRect = event.active.rect.current.initial ?? event.active.rect.current.translated;
    if (!itemRect) {
      return;
    }

    const rawLeft = itemRect.left + event.delta.x - canvasRect.left;
    const rawTop = itemRect.top + event.delta.y - canvasRect.top;

    // Let users pin close to edges while keeping cards recoverable on-screen.
    const overflowX = Math.round(STICKY_WIDTH * 0.35);
    const overflowY = Math.round(STICKY_HEIGHT * 0.35);
    const clampedX = Math.max(-overflowX, Math.min(rawLeft, canvasRect.width - STICKY_WIDTH + overflowX));
    const clampedY = Math.max(-overflowY, Math.min(rawTop, canvasRect.height - STICKY_HEIGHT + overflowY));

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
