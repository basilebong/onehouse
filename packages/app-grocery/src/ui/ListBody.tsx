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

const SectionHeading = ({ children }: { children: string }): ReactElement => (
  <li
    role="presentation"
    className="bg-white px-5 pt-5 pb-2 font-semibold text-[11px] text-slate-600 uppercase tracking-[0.12em]"
  >
    <h2 className="font-semibold">{children}</h2>
  </li>
);

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
    <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto bg-white">
      {active.map((it) => (
        <ItemRow key={it.id} {...rowProps(it)} />
      ))}
      {done.length > 0 && <SectionHeading>{`Got it · ${done.length}`}</SectionHeading>}
      {done.map((it) => (
        <ItemRow key={it.id} {...rowProps(it)} />
      ))}
    </ul>
  );
};
