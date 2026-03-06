import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { fetchItems, updateItem } from './api/sheets';
import { Board } from './components/Board';
import { ConfirmDoneModal } from './components/ConfirmDoneModal';
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
const MAP_WIDTH = 2200;
const MAP_HEIGHT = 1400;

type PendingStatusDecision = {
  itemId: string;
  nextStatus: WishStatus;
  previousStatus: WishStatus;
  x: number;
  y: number;
  previousX?: number;
  previousY?: number;
};

const statusScopeSelector = '[data-status-scope]';

const getScopeStatusForPoint = (pointX: number, pointY: number): WishStatus | undefined => {
  const scopes = document.querySelectorAll<HTMLElement>(statusScopeSelector);

  for (const scope of scopes) {
    const status = scope.dataset.statusScope;
    if (status !== 'in_progress' && status !== 'done') {
      continue;
    }

    const rect = scope.getBoundingClientRect();
    if (pointX >= rect.left && pointX <= rect.right && pointY >= rect.top && pointY <= rect.bottom) {
      return status;
    }
  }

  return undefined;
};

const App = () => {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingStatusDecision, setPendingStatusDecision] = useState<PendingStatusDecision | null>(null);
  const [isDecisionSubmitting, setIsDecisionSubmitting] = useState(false);
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

    const canvasRect = canvas.getBoundingClientRect();
    const scaleRaw = Number(canvas.dataset.mapScale ?? 1);
    const scale = Number.isFinite(scaleRaw) && scaleRaw > 0 ? scaleRaw : 1;
    const itemRect = event.active.rect.current.initial ?? event.active.rect.current.translated;
    if (!itemRect) {
      return;
    }

    const dropCenterX = itemRect.left + event.delta.x + itemRect.width / 2;
    const dropCenterY = itemRect.top + event.delta.y + itemRect.height / 2;
    const nextScopeStatus = getScopeStatusForPoint(dropCenterX, dropCenterY);
    const nextStatus: WishStatus = nextScopeStatus ?? item.status;

    const rawLeft = (itemRect.left + event.delta.x - canvasRect.left) / scale;
    const rawTop = (itemRect.top + event.delta.y - canvasRect.top) / scale;

    // Let users pin close to edges while keeping cards recoverable on-screen.
    const overflowX = Math.round(STICKY_WIDTH * 0.35);
    const overflowY = Math.round(STICKY_HEIGHT * 0.35);
    const clampedX = Math.max(-overflowX, Math.min(rawLeft, MAP_WIDTH - STICKY_WIDTH + overflowX));
    const clampedY = Math.max(-overflowY, Math.min(rawTop, MAP_HEIGHT - STICKY_HEIGHT + overflowY));

    if (nextStatus !== item.status && (nextStatus === 'in_progress' || nextStatus === 'done')) {
      setPendingStatusDecision({
        itemId: id,
        nextStatus,
        previousStatus: item.status,
        x: clampedX,
        y: clampedY,
        previousX: item.x,
        previousY: item.y
      });
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

  const handleCancelDecision = () => {
    if (isDecisionSubmitting) {
      return;
    }
    setPendingStatusDecision(null);
  };

  const handleConfirmDecision = async () => {
    if (!pendingStatusDecision || isDecisionSubmitting) {
      return;
    }

    setIsDecisionSubmitting(true);

    try {
      await persistItemPlacement({
        itemId: pendingStatusDecision.itemId,
        nextStatus: pendingStatusDecision.nextStatus,
        previousStatus: pendingStatusDecision.previousStatus,
        x: pendingStatusDecision.x,
        y: pendingStatusDecision.y,
        previousX: pendingStatusDecision.previousX,
        previousY: pendingStatusDecision.previousY
      });
      setPendingStatusDecision(null);
    } finally {
      setIsDecisionSubmitting(false);
    }
  };

  const decisionCopy =
    pendingStatusDecision?.nextStatus === 'in_progress'
      ? {
          title: 'Забронювати це бажання? 👀',
          description: 'Якщо підтвердиш, інші побачать, що подарунок уже в роботі.',
          confirmLabel: 'Так, бронюю'
        }
      : {
          title: 'Ти прям точно впевнений? 👀',
          description:
            'Бо тіко закриєш цю сторінку — інші не зможуть це подарувать, а ти не зможеш передумать. А мені було лінь тут щось придумувать ВАХХААХ.',
          confirmLabel: 'Так, забираю'
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
          <Board items={items} width={MAP_WIDTH} height={MAP_HEIGHT} />
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

      <ConfirmDoneModal
        open={Boolean(pendingStatusDecision)}
        isSubmitting={isDecisionSubmitting}
        onCancel={handleCancelDecision}
        onConfirm={handleConfirmDecision}
        title={decisionCopy.title}
        description={decisionCopy.description}
        confirmLabel={decisionCopy.confirmLabel}
      />
    </Box>
  );
};

export default App;
