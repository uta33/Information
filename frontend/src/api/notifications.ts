import client from "./client";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Category = "security" | "ai" | "it" | "general";

export interface Notification {
  id: string;
  source_id: string;
  source_name: string;
  external_id: string;
  title: string;
  body: string;
  url: string;
  category: Category;
  severity: Severity;
  cvss_score: number | null;
  is_read: boolean;
  is_saved: boolean;
  read_progress: number;
  published_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

export interface Summary {
  critical: number;
  high: number;
  ai_unread: number;
  it_unread: number;
  security_unread: number;
  total_unread: number;
}

export const fetchNotifications = (params: {
  category?: Category;
  is_saved?: boolean;
  limit?: number;
  offset?: number;
}) =>
  client.get<NotificationListResponse>("/api/notifications", { params }).then((r) => r.data);

export const fetchSummary = () =>
  client.get<Summary>("/api/notifications/summary").then((r) => r.data);

export const updateNotification = (id: string, data: Partial<Pick<Notification, "is_read" | "is_saved" | "read_progress">>) =>
  client.patch<Notification>(`/api/notifications/${id}`, data).then((r) => r.data);

export const markAllRead = (category?: Category) =>
  client.post("/api/notifications/read-all", null, { params: category ? { category } : {} });
