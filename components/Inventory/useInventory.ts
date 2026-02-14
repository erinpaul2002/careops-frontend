"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  adjustInventoryItem,
  archiveInventoryItem,
  createInventoryItem,
  getInventoryItems,
  patchInventoryItem,
} from "@/lib/api/client";
import { mockInventoryItems } from "@/lib/api/mockData";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSessionState,
} from "@/lib/session";
import type {
  InventoryCreateDraft,
  InventoryEditDraft,
  InventoryFilters,
} from "@/components/Inventory/types";
import type { InventoryItem } from "@/lib/api/types";

interface InventoryRuntimeState {
  loading: boolean;
  error: string | null;
  notice: string | null;
  items: InventoryItem[];
  filters: InventoryFilters;
  createDraft: InventoryCreateDraft;
  editDrafts: Record<string, InventoryEditDraft>;
  adjustmentDrafts: Record<string, string>;
  mutatingItemId: string | null;
  creatingItem: boolean;
}

function messageFromError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function parseNonNegativeNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function createDefaultDraft(): InventoryCreateDraft {
  return {
    name: "",
    unit: "",
    quantityOnHand: "0",
    lowStockThreshold: "0",
  };
}

function toEditDraft(item: InventoryItem): InventoryEditDraft {
  return {
    name: item.name,
    unit: item.unit,
    lowStockThreshold: String(item.lowStockThreshold),
  };
}

function mapEditDrafts(items: InventoryItem[]): Record<string, InventoryEditDraft> {
  return Object.fromEntries(items.map((item) => [item.id, toEditDraft(item)]));
}

const initialState: InventoryRuntimeState = {
  loading: true,
  error: null,
  notice: null,
  items: [],
  filters: {
    query: "",
    stockState: "all",
  },
  createDraft: createDefaultDraft(),
  editDrafts: {},
  adjustmentDrafts: {},
  mutatingItemId: null,
  creatingItem: false,
};

export function useInventory() {
  const session = useSyncExternalStore(
    subscribeSessionState,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const [state, setState] = useState<InventoryRuntimeState>(initialState);

  const role = session.role ?? "owner";
  const canManage = role === "owner" || role === "staff";

  const load = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      notice: null,
    }));

    try {
      const items = await getInventoryItems();
      setState((previous) => ({
        ...previous,
        loading: false,
        items,
        editDrafts: mapEditDrafts(items),
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        loading: false,
        items: mockInventoryItems,
        editDrafts: mapEditDrafts(mockInventoryItems),
        error: "Showing fallback inventory preview. API access is unavailable.",
      }));
    }
  }, []);

  useEffect(() => {
    const kickoff = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(kickoff);
  }, [load]);

  const onFilterChange = useCallback(
    (
      field: keyof InventoryFilters,
      value: InventoryFilters[keyof InventoryFilters],
    ) => {
      setState((previous) => ({
        ...previous,
        filters: {
          ...previous.filters,
          [field]: value,
        },
      }));
    },
    [],
  );

  const onCreateDraftChange = useCallback(
    (field: keyof InventoryCreateDraft, value: string) => {
      setState((previous) => ({
        ...previous,
        createDraft: {
          ...previous.createDraft,
          [field]: value,
        },
      }));
    },
    [],
  );

  const onEditDraftChange = useCallback(
    (itemId: string, field: keyof InventoryEditDraft, value: string) => {
      setState((previous) => ({
        ...previous,
        editDrafts: {
          ...previous.editDrafts,
          [itemId]: {
            ...(previous.editDrafts[itemId] ?? {
              name: "",
              unit: "",
              lowStockThreshold: "0",
            }),
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const onAdjustmentDraftChange = useCallback((itemId: string, value: string) => {
    setState((previous) => ({
      ...previous,
      adjustmentDrafts: {
        ...previous.adjustmentDrafts,
        [itemId]: value,
      },
    }));
  }, []);

  const onCreateItem = useCallback(async () => {
    if (!canManage) {
      setState((previous) => ({
        ...previous,
        error: "Your role does not have permission to create inventory items.",
        notice: null,
      }));
      return;
    }

    const name = state.createDraft.name.trim();
    const unit = state.createDraft.unit.trim();
    const quantityOnHand = parseNonNegativeNumber(state.createDraft.quantityOnHand);
    const lowStockThreshold = parseNonNegativeNumber(state.createDraft.lowStockThreshold);

    if (!name || !unit || quantityOnHand === null || lowStockThreshold === null) {
      setState((previous) => ({
        ...previous,
        error: "Name, unit, quantity, and low-stock threshold are required.",
        notice: null,
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      creatingItem: true,
      error: null,
      notice: null,
    }));

    try {
      const created = await createInventoryItem({
        name,
        unit,
        quantityOnHand,
        lowStockThreshold,
      });

      setState((previous) => {
        const items = [...previous.items, created];
        return {
          ...previous,
          creatingItem: false,
          items,
          editDrafts: mapEditDrafts(items),
          createDraft: createDefaultDraft(),
          notice: `${created.name} added to inventory.`,
        };
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        creatingItem: false,
        error: messageFromError(error, "Could not create inventory item."),
        notice: null,
      }));
    }
  }, [canManage, state.createDraft]);

  const onSaveItem = useCallback(
    async (itemId: string) => {
      if (!canManage) {
        setState((previous) => ({
          ...previous,
          error: "Your role does not have permission to update inventory items.",
          notice: null,
        }));
        return;
      }

      const draft = state.editDrafts[itemId];
      if (!draft) {
        return;
      }

      const name = draft.name.trim();
      const unit = draft.unit.trim();
      const lowStockThreshold = parseNonNegativeNumber(draft.lowStockThreshold);

      if (!name || !unit || lowStockThreshold === null) {
        setState((previous) => ({
          ...previous,
          error: "Name, unit, and low-stock threshold must be valid.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        mutatingItemId: itemId,
        error: null,
        notice: null,
      }));

      try {
        const updated = await patchInventoryItem(itemId, {
          name,
          unit,
          lowStockThreshold,
        });

        setState((previous) => {
          const items = previous.items.map((item) =>
            item.id === itemId ? updated : item,
          );
          return {
            ...previous,
            mutatingItemId: null,
            items,
            editDrafts: mapEditDrafts(items),
            notice: `${updated.name} updated.`,
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingItemId: null,
          error: messageFromError(error, "Could not update inventory item."),
          notice: null,
        }));
      }
    },
    [canManage, state.editDrafts],
  );

  const applyAdjust = useCallback(
    async (itemId: string, delta: number): Promise<boolean> => {
      if (!canManage) {
        setState((previous) => ({
          ...previous,
          error: "Your role does not have permission to adjust inventory quantity.",
          notice: null,
        }));
        return false;
      }

      if (!Number.isFinite(delta) || delta === 0) {
        setState((previous) => ({
          ...previous,
          error: "Adjustment must be a non-zero number.",
          notice: null,
        }));
        return false;
      }

      setState((previous) => ({
        ...previous,
        mutatingItemId: itemId,
        error: null,
        notice: null,
      }));

      try {
        const updated = await adjustInventoryItem(itemId, delta);
        setState((previous) => ({
          ...previous,
          mutatingItemId: null,
          items: previous.items.map((item) =>
            item.id === itemId ? updated : item,
          ),
          notice: `Adjusted ${updated.name} by ${delta}.`,
        }));
        return true;
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingItemId: null,
          error: messageFromError(error, "Could not adjust inventory quantity."),
          notice: null,
        }));
        return false;
      }
    },
    [canManage],
  );

  const onQuickAdjust = useCallback(
    async (itemId: string, delta: number) => {
      await applyAdjust(itemId, delta);
    },
    [applyAdjust],
  );

  const onApplyCustomAdjust = useCallback(
    async (itemId: string) => {
      const rawDelta = (state.adjustmentDrafts[itemId] ?? "").trim();
      const delta = Number(rawDelta);

      if (!rawDelta || !Number.isFinite(delta) || delta === 0) {
        setState((previous) => ({
          ...previous,
          error: "Enter a valid non-zero number for custom adjustment.",
          notice: null,
        }));
        return;
      }

      const didApply = await applyAdjust(itemId, delta);
      if (didApply) {
        setState((previous) => ({
          ...previous,
          adjustmentDrafts: {
            ...previous.adjustmentDrafts,
            [itemId]: "",
          },
        }));
      }
    },
    [applyAdjust, state.adjustmentDrafts],
  );

  const onArchiveItem = useCallback(
    async (itemId: string) => {
      if (!canManage) {
        setState((previous) => ({
          ...previous,
          error: "Your role does not have permission to archive inventory items.",
          notice: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        mutatingItemId: itemId,
        error: null,
        notice: null,
      }));

      try {
        const archived = await archiveInventoryItem(itemId);
        setState((previous) => {
          const items = previous.items.filter((item) => item.id !== itemId);
          const editDrafts = { ...previous.editDrafts };
          const adjustmentDrafts = { ...previous.adjustmentDrafts };
          delete editDrafts[itemId];
          delete adjustmentDrafts[itemId];

          return {
            ...previous,
            mutatingItemId: null,
            items,
            editDrafts,
            adjustmentDrafts,
            notice: `${archived.name} archived.`,
          };
        });
      } catch (error) {
        setState((previous) => ({
          ...previous,
          mutatingItemId: null,
          error: messageFromError(error, "Could not archive inventory item."),
          notice: null,
        }));
      }
    },
    [canManage],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = state.filters.query.trim().toLowerCase();

    return state.items.filter((item) => {
      if (normalizedQuery) {
        const target = `${item.name} ${item.unit}`.toLowerCase();
        if (!target.includes(normalizedQuery)) {
          return false;
        }
      }

      const isLowStock = item.quantityOnHand <= item.lowStockThreshold;
      if (state.filters.stockState === "low" && !isLowStock) {
        return false;
      }
      if (state.filters.stockState === "healthy" && isLowStock) {
        return false;
      }

      return true;
    });
  }, [state.filters.query, state.filters.stockState, state.items]);

  const summary = useMemo(
    () => ({
      totalItems: state.items.length,
      lowStockItems: state.items.filter(
        (item) => item.quantityOnHand <= item.lowStockThreshold,
      ).length,
      totalQuantityOnHand: state.items.reduce(
        (total, item) => total + item.quantityOnHand,
        0,
      ),
    }),
    [state.items],
  );

  return {
    ...state,
    role,
    canManage,
    filteredItems,
    summary,
    onRefresh: load,
    onFilterChange,
    onCreateDraftChange,
    onCreateItem,
    onEditDraftChange,
    onAdjustmentDraftChange,
    onSaveItem,
    onQuickAdjust,
    onApplyCustomAdjust,
    onArchiveItem,
  };
}
