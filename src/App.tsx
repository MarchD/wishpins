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
import type { WishItem, WishStatus } from './types';

interface PendingDoneMove {
  itemId: string;
  previousStatus: WishStatus;
}

const assetImageMap = import.meta.glob('./assets/*.svg', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const assetImages = Object.values(assetImageMap);

const randomAssetImage = (): string | undefined => {
  if (assetImages.length === 0) {
    return undefined;
  }
  const randomIndex = Math.floor(Math.random() * assetImages.length);
  return assetImages[randomIndex];
};

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
      setItems(loaded.map((item) => ({ ...item, image: randomAssetImage() })));
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

  const persistStatus = useCallback(async (itemId: string, nextStatus: WishStatus, previousStatus: WishStatus) => {
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
              updatedAt: nowIso
            }
          : item
      )
    );

    try {
      await updateItem({ id: itemId, status: nextStatus });
    } catch (err) {
      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: previousStatus
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
  }, []);

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
    if (!item || item.status === nextStatus || isSubmitting || savingIds.has(id)) {
      return;
    }

    if (nextStatus === 'done') {
      setPendingDoneMove({ itemId: id, previousStatus: item.status });
      return;
    }

    void persistStatus(id, nextStatus, item.status);
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

    setIsSubmitting(true);
    await persistStatus(pendingDoneMove.itemId, 'done', pendingDoneMove.previousStatus);
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
