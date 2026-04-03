import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, fetchSummary, updateNotification, markAllRead, type Category } from "../api/notifications";

export function useSummary() {
  return useQuery({ queryKey: ["summary"], queryFn: fetchSummary, refetchInterval: 60_000 });
}

export function useNotifications(category?: Category, isSaved?: boolean) {
  return useQuery({
    queryKey: ["notifications", category, isSaved],
    queryFn: () => fetchNotifications({ category, is_saved: isSaved, limit: 50 }),
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => updateNotification(id, { is_read: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["summary"] }); },
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_saved }: { id: string; is_saved: boolean }) => updateNotification(id, { is_saved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (category?: Category) => markAllRead(category),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["summary"] }); },
  });
}
