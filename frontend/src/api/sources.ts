export type SourceType = "rss" | "cve" | "jvn";
export type SourceCategory = "security" | "ai" | "it" | "general";

export interface Source {
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  enabled: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const fetchSources = (): Promise<Source[]> =>
  fetch(`${BASE}/data/sources.json`).then((r) => r.json());
