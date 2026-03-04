import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import { fetchItems, updateItem } from './api/sheets';
import { Board } from './components/Board';
import { ConfirmDoneModal } from './components/ConfirmDoneModal';
import { STICKY_HEIGHT, STICKY_WIDTH } from './components/StickyCard';
import type { WishItem, WishStatus } from './types';

interface PendingDoneMove {
  itemId: string;
  previousStatus: WishStatus;
  x: number;
  y: number;
}

const App = () => {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDoneMove, setPendingDoneMove] = useState<PendingDoneMove | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        await updateItem({ id: itemId, status: nextStatus, x, y });
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
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const destination = event.over?.id;
    if (!destination) {
      return;
    }

    const nextStatus = String(destination) as WishStatus;
    if (nextStatus !== 'todo' && nextStatus !== 'in_progress' && nextStatus !== 'done') {
      return;
    }

    const id = String(event.active.id);
    const item = itemById.get(id);
    if (!item || isSubmitting || savingIds.has(id)) {
      return;
    }

    const canvas = document.getElementById('wishpins-canvas');
    if (!canvas) {
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const itemRect = event.active.rect.current.initial ?? event.active.rect.current.translated;
    if (!itemRect) {
      return;
    }

    const rawLeft = itemRect.left + event.delta.x - canvasRect.left;
    const rawTop = itemRect.top + event.delta.y - canvasRect.top;

    const clampedX = Math.max(8, Math.min(rawLeft, canvasRect.width - STICKY_WIDTH - 8));
    const clampedY = Math.max(8, Math.min(rawTop, canvasRect.height - STICKY_HEIGHT - 8));

    if (nextStatus === 'done') {
      setPendingDoneMove({ itemId: id, previousStatus: item.status, x: clampedX, y: clampedY });
      return;
    }

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

  const handleCancelDone = () => {
    if (isSubmitting) {
      return;
    }
    setPendingDoneMove(null);
  };

  const handleConfirmDone = async () => {
    if (!pendingDoneMove || isSubmitting || savingIds.has(pendingDoneMove.itemId)) {
      return;
    }

    const item = itemById.get(pendingDoneMove.itemId);
    if (!item) {
      return;
    }

    setIsSubmitting(true);
    await persistItemPlacement({
      itemId: pendingDoneMove.itemId,
      nextStatus: 'done',
      previousStatus: pendingDoneMove.previousStatus,
      x: pendingDoneMove.x,
      y: pendingDoneMove.y,
      previousX: item.x,
      previousY: item.y
    });
    setPendingDoneMove(null);
    setIsSubmitting(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: '#f6f4ef' }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography variant="h4" fontWeight={800}>
            WishPins
          </Typography>
          <Button variant="contained" onClick={() => void loadItems()} disabled={loading || isSubmitting}>
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" minHeight={320} spacing={1}>
            <CircularProgress />
            <Typography color="text.secondary">Loading board...</Typography>
          </Stack>
        ) : error ? (
          <Stack spacing={2} alignItems="flex-start">
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
      </Container>

      <ConfirmDoneModal
        open={Boolean(pendingDoneMove)}
        isSubmitting={isSubmitting}
        onCancel={handleCancelDone}
        onConfirm={() => void handleConfirmDone()}
      />

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
