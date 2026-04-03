import client from "./client";

export type SourceType = "rss" | "cve" | "jvn";
export type SourceCategory = "security" | "ai" | "it" | "general";

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  is_enabled: boolean;
  poll_interval_minutes: number;
  last_fetched_at: string | null;
  created_at: string;
}

export interface SourceCreate {
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  poll_interval_minutes?: number;
}

export const fetchSources = () =>
  client.get<Source[]>("/api/sources").then((r) => r.data);

export const createSource = (data: SourceCreate) =>
  client.post<Source>("/api/sources", data).then((r) => r.data);

export const updateSource = (id: string, data: Partial<Source>) =>
  client.patch<Source>(`/api/sources/${id}`, data).then((r) => r.data);

export const deleteSource = (id: string) =>
  client.delete(`/api/sources/${id}`);

export const fetchNow = (id: string) =>
  client.post(`/api/sources/${id}/fetch-now`);

export const getVapidPublicKey = () =>
  client.get<{ public_key: string }>("/api/push/vapid-public-key").then((r) => r.data);

export const subscribePush = (sub: { endpoint: string; p256dh: string; auth: string }) =>
  client.post("/api/push/subscribe", sub);

export const sendTestPush = () =>
  client.post("/api/push/test");
