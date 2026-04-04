import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import {
  fetchAllNotifications,
  fetchSummaryData,
  getReadIds,
  getSavedIds,
  markRead,
  markAllRead as markAllReadLS,
  toggleSaved as toggleSavedLS,
  type Category,
  type Notification,
} from "../api/notifications";

/** Decorated notification with local read/saved state */
export interface NotificationVM extends Notification {
  is_read: boolean;
  is_saved: boolean;
  read_progress: number;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummaryData,
    refetchInterval: 5 * 60_000,
  });
}

// ─── Notification list with local state overlay ───────────────────────────────

export function useNotifications(category?: Category, isSaved?: boolean) {
  const qc = useQueryClient();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchAllNotifications,
    refetchInterval: 5 * 60_000,
  });

  // Local state (re-read on every render – fast since it's just a Set construction)
  const readIds = useMemo(() => getReadIds(), [raw]);  // re-compute when raw changes
  const savedIds = useMemo(() => getSavedIds(), [raw]);

  const items: NotificationVM[] = useMemo(() => {
    if (!raw) return [];
    return raw.items
      .map((n) => ({
        ...n,
        is_read: readIds.has(n.id),
        is_saved: savedIds.has(n.id),
        read_progress: 0,
      }))
      .filter((n) => {
        if (category && n.category !== category) return false;
        if (isSaved && !n.is_saved) return false;
        return true;
      });
  }, [raw, readIds, savedIds, category, isSaved]);

  const unreadCount = useMemo(
    () => (raw?.items ?? []).filter((n) => !readIds.has(n.id)).length,
    [raw, readIds]
  );

  return { items, isLoading, unreadCount, total: items.length };
}

// ─── Mutations (update localStorage + invalidate query cache) ─────────────────

export function useMarkRead() {
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      markRead(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    [qc]
  );
}

export function useToggleSaved() {
  const qc = useQueryClient();
  return useCallback(
    (id: string) => {
      toggleSavedLS(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    [qc]
  );
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useCallback(
    (items: Notification[]) => {
      markAllReadLS(items.map((n) => n.id));
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    [qc]
  );
}
