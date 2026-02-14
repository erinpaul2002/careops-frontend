"use client";

import InventoryUI from "@/components/Inventory/InventoryUI";
import { useInventory } from "@/components/Inventory/useInventory";

export default function Inventory() {
  const {
    loading,
    error,
    notice,
    role,
    canManage,
    items,
    filteredItems,
    filters,
    createDraft,
    editDrafts,
    adjustmentDrafts,
    mutatingItemId,
    creatingItem,
    summary,
    onRefresh,
    onFilterChange,
    onCreateDraftChange,
    onCreateItem,
    onEditDraftChange,
    onAdjustmentDraftChange,
    onSaveItem,
    onQuickAdjust,
    onApplyCustomAdjust,
    onArchiveItem,
  } = useInventory();

  return (
    <InventoryUI
      loading={loading}
      error={error}
      notice={notice}
      role={role}
      canManage={canManage}
      items={items}
      filteredItems={filteredItems}
      filters={filters}
      createDraft={createDraft}
      editDrafts={editDrafts}
      adjustmentDrafts={adjustmentDrafts}
      mutatingItemId={mutatingItemId}
      creatingItem={creatingItem}
      summary={summary}
      onRefresh={onRefresh}
      onFilterChange={onFilterChange}
      onCreateDraftChange={onCreateDraftChange}
      onCreateItem={onCreateItem}
      onEditDraftChange={onEditDraftChange}
      onAdjustmentDraftChange={onAdjustmentDraftChange}
      onSaveItem={onSaveItem}
      onQuickAdjust={onQuickAdjust}
      onApplyCustomAdjust={onApplyCustomAdjust}
      onArchiveItem={onArchiveItem}
    />
  );
}