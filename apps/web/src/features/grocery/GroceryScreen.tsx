import type {
  CreateItemInput,
  GroceryItem,
  GroceryItemId,
  UpdateItemInput,
} from "@onehouse/app-grocery/shared";
import { isPurchased, parseGroceryItemId } from "@onehouse/app-grocery/shared";
import {
  AddItemForm,
  BottomNav,
  EditItemForm,
  EmptyState,
  Fab,
  type ItemSyncState,
  ListBody,
  ListSkeleton,
  OfflineBanner,
  TopBar,
} from "@onehouse/app-grocery/ui";
import { type UserId, parseUserId } from "@onehouse/core/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { match } from "ts-pattern";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSession } from "@/lib/auth-client";
import { createItem, deleteItem, fetchItems, togglePurchased, updateItem } from "@/lib/grocery-api";

const ITEMS_QUERY_KEY = ["grocery", "items"] as const;
const TEMP_ID_PREFIX = "tmp_";
const FALLBACK_USER_ID: UserId = parseUserId("me");

const isTempId = (id: GroceryItemId): boolean => id.startsWith(TEMP_ID_PREFIX);

type Identity = {
  id: UserId;
  name: string;
  initial: string;
};

const useIdentity = (): Identity => {
  const session = useSession();
  const user = session.data?.user;
  if (user === undefined) return { id: FALLBACK_USER_ID, name: "You", initial: "·" };
  const trimmed = user.name?.trim();
  const name = trimmed !== undefined && trimmed.length > 0 ? trimmed : (user.email ?? "You");
  const initial = name.charAt(0).toUpperCase() || "·";
  return { id: parseUserId(user.id), name, initial };
};

type DrawerState =
  | { kind: "none" }
  | { kind: "add" }
  | { kind: "edit"; id: GroceryItemId }
  | { kind: "remove"; id: GroceryItemId };

const DRAWER_NONE: DrawerState = { kind: "none" };

export const GroceryScreen = (): ReactElement => {
  const qc = useQueryClient();
  const online = useOnlineStatus();
  const identity = useIdentity();
  const [drawer, setDrawer] = useState<DrawerState>(DRAWER_NONE);
  const [pending, setPending] = useState<ReadonlyMap<GroceryItemId, ItemSyncState>>(
    () => new Map(),
  );

  const items = useQuery({ queryKey: ITEMS_QUERY_KEY, queryFn: fetchItems });

  const setSync = (id: GroceryItemId, state: ItemSyncState | null): void => {
    setPending((prev) => {
      const next = new Map(prev);
      if (state === null) next.delete(id);
      else next.set(id, state);
      return next;
    });
  };

  const closeIfMatches = (id: GroceryItemId): void => {
    setDrawer((current) => {
      if ((current.kind === "edit" || current.kind === "remove") && current.id === id) {
        return DRAWER_NONE;
      }
      return current;
    });
  };

  useEffect(() => {
    if (items.data === undefined) return;
    setPending((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const [id, state] of prev) {
        if (state === "error") {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items.data]);

  const create = useMutation({
    mutationFn: createItem,
    onMutate: async (input: CreateItemInput) => {
      await qc.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
      const tempId = parseGroceryItemId(`${TEMP_ID_PREFIX}${crypto.randomUUID()}`);
      const optimistic: GroceryItem = {
        id: tempId,
        name: input.name,
        description: input.description ?? null,
        status: { kind: "pending" },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        addedBy: { id: identity.id, name: identity.name, initial: identity.initial },
      };
      const previous = qc.getQueryData<GroceryItem[]>(ITEMS_QUERY_KEY) ?? [];
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, [optimistic, ...previous]);
      setSync(tempId, "queued");
      return { tempId, previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx) {
        qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, ctx.previous);
        setSync(ctx.tempId, null);
      }
      toast.error("Could not add item");
    },
    onSuccess: (saved, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).map((i) => (i.id === ctx.tempId ? saved : i)),
      );
      setSync(ctx.tempId, null);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, purchased }: { id: GroceryItemId; purchased: boolean }) =>
      togglePurchased(id, purchased),
    onMutate: async ({ id, purchased }) => {
      await qc.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
      const previous = qc.getQueryData<GroceryItem[]>(ITEMS_QUERY_KEY) ?? [];
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).map((i) =>
          i.id === id
            ? {
                ...i,
                status: purchased
                  ? { kind: "purchased", purchasedAt: Date.now(), purchasedBy: identity.id }
                  : { kind: "pending" },
                updatedAt: Date.now(),
              }
            : i,
        ),
      );
      setSync(id, "queued");
      return { previous, id };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx) {
        qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, ctx.previous);
        setSync(ctx.id, "error");
      }
      toast.error("Could not update item");
    },
    onSuccess: (saved, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).map((i) => (i.id === ctx.id ? saved : i)),
      );
      setSync(ctx.id, null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: GroceryItemId; input: UpdateItemInput }) =>
      updateItem(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
      const previous = qc.getQueryData<GroceryItem[]>(ITEMS_QUERY_KEY) ?? [];
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).map((i) =>
          i.id === id
            ? {
                ...i,
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.description !== undefined ? { description: input.description } : {}),
                updatedAt: Date.now(),
              }
            : i,
        ),
      );
      setSync(id, "queued");
      return { previous, id };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx) {
        qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, ctx.previous);
        setSync(ctx.id, "error");
      }
      toast.error("Could not update item");
    },
    onSuccess: (saved, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).map((i) => (i.id === ctx.id ? saved : i)),
      );
      setSync(ctx.id, null);
      closeIfMatches(ctx.id);
    },
  });

  const remove = useMutation({
    mutationFn: (id: GroceryItemId) => deleteItem(id),
    onMutate: async (id: GroceryItemId) => {
      await qc.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
      const previous = qc.getQueryData<GroceryItem[]>(ITEMS_QUERY_KEY) ?? [];
      qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, (current) =>
        (current ?? []).filter((i) => i.id !== id),
      );
      setSync(id, null);
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx) qc.setQueryData<GroceryItem[]>(ITEMS_QUERY_KEY, ctx.previous);
      toast.error("Could not remove item");
    },
  });

  const visibleItems = items.data ?? [];

  const counts = useMemo(() => {
    const total = visibleItems.length;
    const done = visibleItems.filter((i) => isPurchased(i.status)).length;
    const queued = Array.from(pending.values()).filter((s) => s === "queued").length;
    return { total, done, queued };
  }, [visibleItems, pending]);

  useEffect(() => {
    if (online) {
      void qc.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    }
  }, [online, qc]);

  const handleToggle = (id: GroceryItemId, purchased: boolean): void => {
    if (isTempId(id)) return;
    toggle.mutate({ id, purchased });
  };

  const handleRetry = (id: GroceryItemId): void => {
    if (isTempId(id)) return;
    const item = visibleItems.find((i) => i.id === id);
    if (item === undefined) return;
    toggle.mutate({ id, purchased: !isPurchased(item.status) });
  };

  const handleCreate = (input: CreateItemInput): void => {
    create.mutate(input);
    setDrawer(DRAWER_NONE);
  };

  const handleRemove = (id: GroceryItemId): void => {
    if (isTempId(id)) return;
    setDrawer({ kind: "remove", id });
  };

  const handleConfirmRemove = (id: GroceryItemId): void => {
    remove.mutate(id);
    setDrawer(DRAWER_NONE);
  };

  const handleEditOpen = (id: GroceryItemId): void => {
    if (isTempId(id)) return;
    setDrawer({ kind: "edit", id });
  };

  const handleEditSubmit = (id: GroceryItemId, input: UpdateItemInput): void => {
    update.mutate({ id, input });
  };

  if (items.isPending) {
    return (
      <main className="flex min-h-dvh flex-col bg-slate-50">
        <ListSkeleton />
        <BottomNav active="grocery" />
      </main>
    );
  }

  const editingItem = match(drawer)
    .with({ kind: "edit" }, ({ id }) => visibleItems.find((i) => i.id === id) ?? null)
    .otherwise(() => null);
  const removingItem = match(drawer)
    .with({ kind: "remove" }, ({ id }) => visibleItems.find((i) => i.id === id) ?? null)
    .otherwise(() => null);

  return (
    <main className="flex min-h-dvh flex-col bg-slate-50">
      <TopBar count={counts.total} doneCount={counts.done} queuedCount={counts.queued} />
      {!online && <OfflineBanner queuedCount={counts.queued} />}
      {visibleItems.length === 0 ? (
        <EmptyState />
      ) : (
        <ListBody
          items={visibleItems}
          syncStates={pending}
          onToggle={handleToggle}
          onRetry={handleRetry}
          onEdit={handleEditOpen}
          onRemove={handleRemove}
        />
      )}
      <Fab onClick={() => setDrawer({ kind: "add" })} />
      <BottomNav active="grocery" />

      <Drawer
        open={drawer.kind === "add"}
        onOpenChange={(open) => {
          if (!open) setDrawer(DRAWER_NONE);
        }}
      >
        <DrawerContent className="rounded-t-3xl bg-white">
          <DrawerTitle className="sr-only">Add a grocery item</DrawerTitle>
          <DrawerDescription className="sr-only">
            Name the item, optionally add a description.
          </DrawerDescription>
          <div className="flex max-h-[70dvh] flex-col pt-3 pb-2">
            {drawer.kind === "add" && (
              <AddItemForm onSubmit={handleCreate} onCancel={() => setDrawer(DRAWER_NONE)} />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={editingItem !== null}
        onOpenChange={(open) => {
          if (open) return;
          if (update.isPending) return;
          setDrawer(DRAWER_NONE);
        }}
      >
        <DrawerContent className="rounded-t-3xl bg-white">
          <DrawerTitle className="sr-only">Edit grocery item</DrawerTitle>
          <DrawerDescription className="sr-only">
            Change the item name or description.
          </DrawerDescription>
          <div className="flex max-h-[70dvh] flex-col pt-3 pb-2">
            {editingItem !== null && (
              <EditItemForm
                initialName={editingItem.name}
                initialDescription={editingItem.description ?? ""}
                pending={update.isPending && update.variables?.id === editingItem.id}
                onSubmit={(input) => handleEditSubmit(editingItem.id, input)}
                onCancel={() => setDrawer(DRAWER_NONE)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={removingItem !== null}
        onOpenChange={(open) => {
          if (!open) setDrawer(DRAWER_NONE);
        }}
      >
        <DrawerContent
          className="rounded-t-3xl bg-white"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DrawerTitle className="px-5 pt-2 font-semibold text-lg text-slate-900">
            Remove {removingItem?.name ?? "item"}?
          </DrawerTitle>
          <DrawerDescription className="px-5 pt-1 text-slate-600 text-sm">
            This can't be undone — the item will be gone for everyone in the household.
          </DrawerDescription>
          <div className="flex flex-col gap-2.5 px-5 pt-5 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <button
              type="button"
              onClick={() => setDrawer(DRAWER_NONE)}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-100 font-medium text-base text-slate-900 transition active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => removingItem !== null && handleConfirmRemove(removingItem.id)}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-rose-600 font-medium text-base text-white transition active:scale-[0.98]"
            >
              Remove
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
};
