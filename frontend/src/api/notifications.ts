export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Category = "security" | "ai" | "it" | "general";

export interface Notification {
  id: string;
  content_hash: string;
  source_name: string;
  external_id: string;
  title: string;
  body: string;
  url: string;
  category: Category;
  severity: Severity;
  cvss_score: number | null;
  published_at: string | null;
  created_at: string;
}

export interface NotificationsData {
  generated_at: string | null;
  items: Notification[];
}

export interface Summary {
  generated_at: string | null;
  critical: number;
  high: number;
  ai_unread: number;
  it_unread: number;
  security_unread: number;
  total: number;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const fetchAllNotifications = (): Promise<NotificationsData> =>
  fetch(`${BASE}/data/notifications.json`).then((r) => {
    if (!r.ok) throw new Error("fetch failed");
    return r.json();
  });

export const fetchSummaryData = (): Promise<Summary> =>
  fetch(`${BASE}/data/summary.json`).then((r) => {
    if (!r.ok) throw new Error("fetch failed");
    return r.json();
  });

// ─── LocalStorage state (read / saved) ───────────────────────────────────────

const LS_KEY = "infowatch_state";

interface LocalState {
  readIds: string[];
  savedIds: string[];
}

function loadLocalState(): LocalState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return { readIds: [], savedIds: [] };
}

function saveLocalState(state: LocalState): void {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export function getReadIds(): Set<string> {
  return new Set(loadLocalState().readIds);
}

export function getSavedIds(): Set<string> {
  return new Set(loadLocalState().savedIds);
}

export function markRead(id: string): void {
  const state = loadLocalState();
  if (!state.readIds.includes(id)) {
    state.readIds.push(id);
    saveLocalState(state);
  }
}

export function markAllRead(ids: string[]): void {
  const state = loadLocalState();
  const set = new Set(state.readIds);
  ids.forEach((id) => set.add(id));
  state.readIds = Array.from(set);
  saveLocalState(state);
}

export function toggleSaved(id: string): boolean {
  const state = loadLocalState();
  const idx = state.savedIds.indexOf(id);
  if (idx === -1) {
    state.savedIds.push(id);
    saveLocalState(state);
    return true;
  } else {
    state.savedIds.splice(idx, 1);
    saveLocalState(state);
    return false;
  }
}
