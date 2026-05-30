import type { ReactElement } from "react";
import { type GroceryItem, type GroceryItemId, isPurchased } from "../shared/index.ts";
import { ItemRow, type ItemSyncState } from "./ItemRow.tsx";

type ListBodyProps = {
  items: readonly GroceryItem[];
  syncStates?: ReadonlyMap<GroceryItemId, ItemSyncState>;
  onToggle?: (id: GroceryItemId, purchased: boolean) => void;
  onRetry?: (id: GroceryItemId) => void;
  onEdit?: (id: GroceryItemId) => void;
  onRemove?: (id: GroceryItemId) => void;
};

export const ListBody = ({
  items,
  syncStates,
  onToggle,
  onRetry,
  onEdit,
  onRemove,
}: ListBodyProps): ReactElement => {
  const active = items.filter((i) => !isPurchased(i.status));
  const done = items.filter((i) => isPurchased(i.status));
  const sync = (id: GroceryItemId): ItemSyncState => syncStates?.get(id) ?? "synced";
  const rowProps = (it: GroceryItem) => ({
    item: it,
    syncState: sync(it.id),
    ...(onToggle ? { onToggle: (next: boolean) => onToggle(it.id, next) } : {}),
    ...(onRetry ? { onRetry: () => onRetry(it.id) } : {}),
    ...(onEdit ? { onEdit: () => onEdit(it.id) } : {}),
    ...(onRemove ? { onRemove: () => onRemove(it.id) } : {}),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <ul aria-label="To buy" className="divide-y divide-slate-100">
        {active.map((it) => (
          <ItemRow key={it.id} {...rowProps(it)} />
        ))}
      </ul>
      {done.length > 0 && (
        <>
          <h2 className="bg-white px-5 pt-5 pb-2 font-semibold text-[11px] text-slate-600 uppercase tracking-[0.12em]">
            {`Got it · ${done.length}`}
          </h2>
          <ul aria-label="Already bought" className="divide-y divide-slate-100">
            {done.map((it) => (
              <ItemRow key={it.id} {...rowProps(it)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
