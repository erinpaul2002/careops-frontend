import type { InventoryItem } from "@/lib/api/types";

export interface InventoryFilters {
  query: string;
  stockState: "all" | "low" | "healthy";
}

export interface InventoryCreateDraft {
  name: string;
  unit: string;
  quantityOnHand: string;
  lowStockThreshold: string;
}

export interface InventoryEditDraft {
  name: string;
  unit: string;
  lowStockThreshold: string;
}

export interface InventoryState {
  loading: boolean;
  error: string | null;
  notice: string | null;
  role: "owner" | "staff";
  canManage: boolean;
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  filters: InventoryFilters;
  createDraft: InventoryCreateDraft;
  editDrafts: Record<string, InventoryEditDraft>;
  adjustmentDrafts: Record<string, string>;
  mutatingItemId: string | null;
  creatingItem: boolean;
  summary: {
    totalItems: number;
    lowStockItems: number;
    totalQuantityOnHand: number;
  };
}

export interface InventoryUIProps extends InventoryState {
  onFilterChange: (
    field: keyof InventoryFilters,
    value: InventoryFilters[keyof InventoryFilters],
  ) => void;
  onCreateDraftChange: (
    field: keyof InventoryCreateDraft,
    value: string,
  ) => void;
  onCreateItem: () => Promise<void>;
  onEditDraftChange: (
    itemId: string,
    field: keyof InventoryEditDraft,
    value: string,
  ) => void;
  onAdjustmentDraftChange: (itemId: string, value: string) => void;
  onSaveItem: (itemId: string) => Promise<void>;
  onQuickAdjust: (itemId: string, delta: number) => Promise<void>;
  onApplyCustomAdjust: (itemId: string) => Promise<void>;
  onArchiveItem: (itemId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}