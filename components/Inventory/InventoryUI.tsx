"use client";

import { useState } from "react";
import {
  Archive,
  Boxes,
  CircleAlert,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  InventoryEditDraft,
  InventoryFilters,
  InventoryUIProps,
} from "@/components/Inventory/types";

const depthColors = ["#00AA6C", "#FFD500", "#2563EB"];

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <article className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide" style={{ color: "#5A6A7A" }}>
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: `${accent}14`, border: `1px solid ${accent}33` }}
        >
          {icon}
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
        {value}
      </p>
    </article>
  );
}

function updateButtonStyle(button: HTMLButtonElement, active: boolean) {
  button.style.background = active ? "#00AA6C" : "#ffffff";
  button.style.color = active ? "#ffffff" : "#1A1A1A";
  button.style.borderColor = active ? "#00AA6C" : "var(--border)";
}

function isItemEditDirty(item: {
  name: string;
  unit: string;
  lowStockThreshold: number;
}, draft: InventoryEditDraft): boolean {
  return (
    draft.name !== item.name ||
    draft.unit !== item.unit ||
    draft.lowStockThreshold !== String(item.lowStockThreshold)
  );
}

export default function InventoryUI({
  loading,
  error,
  notice,
  role,
  canManage,
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
}: InventoryUIProps) {
  const [editingItemIds, setEditingItemIds] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="stratum-header">Supply Layer - Inventory Control</p>
          <h2 className="mt-1 text-2xl font-semibold" style={{ color: "#1A1A1A" }}>
            Inventory Management
          </h2>
          <p className="mt-1 text-xs" style={{ color: "#5A6A7A" }}>
            Signed in as {role}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all duration-200"
          style={{ borderColor: "var(--border)", color: "#1A1A1A", background: "#ffffff" }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = "#00AA6C";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
            style={{ color: "#00AA6C" }}
          />
          Refresh
        </button>
      </div>

      <div className="fault-line" />

      {error ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#EF444440", background: "#FEF2F2", color: "#991B1B" }}
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#00AA6C40", background: "#ECFDF5", color: "#065F46" }}
        >
          {notice}
        </div>
      ) : null}

      {!canManage ? (
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "#F59E0B40", background: "#FFFBEB", color: "#92400E" }}
        >
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <p>Your account is currently read-only for inventory actions.</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<Boxes size={16} style={{ color: "#00AA6C" }} />}
          label="Active Items"
          value={String(summary.totalItems)}
          accent="#00AA6C"
        />
        <SummaryCard
          icon={<TrendingDown size={16} style={{ color: "#EF4444" }} />}
          label="Low Stock"
          value={String(summary.lowStockItems)}
          accent="#EF4444"
        />
        <SummaryCard
          icon={<Warehouse size={16} style={{ color: "#2563EB" }} />}
          label="Units On Hand"
          value={String(summary.totalQuantityOnHand)}
          accent="#2563EB"
        />
      </div>

      <section className="panel p-4">
        <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
          Search and Filter
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Search by item or unit</span>
            <div className="relative mt-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#5A6A7A" }}
              />
              <input
                value={filters.query}
                onChange={(event) => onFilterChange("query", event.target.value)}
                className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
                style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
                placeholder="Bandages, ml, packs..."
              />
            </div>
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Stock state</span>
            <div className="relative mt-1">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#5A6A7A" }}
              />
              <select
                value={filters.stockState}
                onChange={(event) =>
                  onFilterChange(
                    "stockState",
                    event.target.value as InventoryFilters["stockState"],
                  )
                }
                className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
                style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              >
                <option value="all">All items</option>
                <option value="low">Low stock only</option>
                <option value="healthy">Healthy stock only</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
            Add New Inventory Item
          </h3>
          <StatusBadge
            tone={canManage ? "success" : "warning"}
            label={canManage ? "editable" : "read only"}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Item name</span>
            <input
              value={createDraft.name}
              onChange={(event) => onCreateDraftChange("name", event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="Sterile gloves"
              disabled={!canManage || creatingItem}
            />
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Unit</span>
            <input
              value={createDraft.unit}
              onChange={(event) => onCreateDraftChange("unit", event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="boxes"
              disabled={!canManage || creatingItem}
            />
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Quantity on hand</span>
            <input
              value={createDraft.quantityOnHand}
              onChange={(event) =>
                onCreateDraftChange("quantityOnHand", event.target.value)
              }
              type="number"
              min="0"
              step="1"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="0"
              disabled={!canManage || creatingItem}
            />
          </label>

          <label className="block text-sm">
            <span style={{ color: "#1A1A1A" }}>Low-stock threshold</span>
            <input
              value={createDraft.lowStockThreshold}
              onChange={(event) =>
                onCreateDraftChange("lowStockThreshold", event.target.value)
              }
              type="number"
              min="0"
              step="1"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
              placeholder="0"
              disabled={!canManage || creatingItem}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void onCreateItem()}
          disabled={!canManage || creatingItem}
          className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{ background: "#00AA6C", color: "#fff" }}
        >
          <Plus size={15} />
          {creatingItem ? "Adding item..." : "Add inventory item"}
        </button>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredItems.map((item, index) => {
          const isLowStock = item.quantityOnHand <= item.lowStockThreshold;
          const draft: InventoryEditDraft = editDrafts[item.id] ?? {
            name: item.name,
            unit: item.unit,
            lowStockThreshold: String(item.lowStockThreshold),
          };
          const customAdjustment = adjustmentDrafts[item.id] ?? "";
          const mutating = mutatingItemId === item.id;
          const isEditingItem = editingItemIds[item.id] ?? false;
          const itemDirty = isItemEditDirty(item, draft);
          const accentColor = depthColors[index % depthColors.length];

          return (
            <article key={item.id} className="panel relative overflow-hidden p-4">
              <div
                className="absolute bottom-0 left-0 top-0 w-[3px]"
                style={{ background: accentColor }}
              />

              <div className="flex items-start justify-between gap-2 pl-2">
                <div>
                  <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: "#5A6A7A" }}>
                    Current unit: {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    tone={isLowStock ? "danger" : "success"}
                    label={isLowStock ? "low stock" : "healthy"}
                  />
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded"
                    style={{
                      background: `${accentColor}12`,
                      border: `1px solid ${accentColor}25`,
                    }}
                  >
                    <Package size={14} style={{ color: accentColor }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pl-2">
                <p className="text-xs uppercase tracking-wide" style={{ color: "#5A6A7A" }}>
                  Quantity on hand
                </p>
                <p className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
                  {item.quantityOnHand}
                </p>
              </div>

              <div className="mt-4 grid gap-2 pl-2 md:grid-cols-2">
                <label className="block text-xs">
                  <span style={{ color: "#5A6A7A" }}>Name</span>
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      onEditDraftChange(item.id, "name", event.target.value)
                    }
                    className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                    disabled={!canManage || mutating || !isEditingItem}
                  />
                </label>

                <label className="block text-xs">
                  <span style={{ color: "#5A6A7A" }}>Unit</span>
                  <input
                    value={draft.unit}
                    onChange={(event) =>
                      onEditDraftChange(item.id, "unit", event.target.value)
                    }
                    className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                    disabled={!canManage || mutating || !isEditingItem}
                  />
                </label>

                <label className="block text-xs md:col-span-2">
                  <span style={{ color: "#5A6A7A" }}>Low-stock threshold</span>
                  <input
                    value={draft.lowStockThreshold}
                    onChange={(event) =>
                      onEditDraftChange(
                        item.id,
                        "lowStockThreshold",
                        event.target.value,
                      )
                    }
                    type="number"
                    min="0"
                    step="1"
                    className="mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                    disabled={!canManage || mutating || !isEditingItem}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2 pl-2">
                <p className="text-xs" style={{ color: "#5A6A7A" }}>
                  Quick adjustment
                </p>
                <div className="flex flex-wrap gap-2">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={`${item.id}-${delta}`}
                      type="button"
                      onClick={() => void onQuickAdjust(item.id, delta)}
                      disabled={!canManage || mutating}
                      className="rounded border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 disabled:opacity-60"
                      style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                      onMouseEnter={(event) => {
                        updateButtonStyle(event.currentTarget, delta > 0);
                      }}
                      onMouseLeave={(event) => {
                        updateButtonStyle(event.currentTarget, false);
                      }}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={customAdjustment}
                    onChange={(event) =>
                      onAdjustmentDraftChange(item.id, event.target.value)
                    }
                    type="number"
                    className="w-32 rounded-md border px-2.5 py-1.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                    placeholder="Custom delta"
                    disabled={!canManage || mutating}
                  />
                  <button
                    type="button"
                    onClick={() => void onApplyCustomAdjust(item.id)}
                    disabled={!canManage || mutating}
                    className="rounded border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                    style={{ borderColor: "var(--border)", color: "#1A1A1A" }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 pl-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingItemIds((previous) => ({
                      ...previous,
                      [item.id]: !previous[item.id],
                    }))
                  }
                  disabled={!canManage || mutating}
                  className="rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: "var(--border)", background: "#fff", color: "#1A1A1A" }}
                >
                  {isEditingItem ? "Done" : "Edit"}
                </button>
                {isEditingItem && itemDirty ? (
                  <button
                    type="button"
                    onClick={() => void onSaveItem(item.id)}
                    disabled={!canManage || mutating}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    style={{ background: "#00AA6C", color: "#fff" }}
                  >
                    {mutating ? "Saving..." : "Save"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onArchiveItem(item.id)}
                  disabled={!canManage || mutating}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                  style={{ borderColor: "#EF444440", color: "#EF4444" }}
                >
                  <Archive size={12} />
                  Archive
                </button>
              </div>

              {isLowStock ? (
                <div
                  className="mt-3 flex items-center gap-1.5 pl-2 text-xs"
                  style={{ color: "#B45309" }}
                >
                  <CircleAlert size={12} />
                  Quantity is at or below threshold.
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {!filteredItems.length ? (
        <p className="text-sm" style={{ color: "#5A6A7A" }}>
          No inventory items match your filters.
        </p>
      ) : null}
    </div>
  );
}
