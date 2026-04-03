import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotifications, useMarkAllRead } from "../hooks/useNotifications";
import NotificationCard from "../components/notifications/NotificationCard";
import type { Category } from "../api/notifications";

const TABS: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "security", label: "🔐 緊急" },
  { key: "ai", label: "🤖 AI" },
  { key: "it", label: "📰 IT" },
];

export default function InboxPage() {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Category) || "all";
  const [activeTab, setActiveTab] = useState<Category | "all">(initialTab);
  const category = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading } = useNotifications(category);
  const markAll = useMarkAllRead();

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
        <div className="px-4 pt-12 pb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">受信トレイ</h1>
          {(data?.unread_count ?? 0) > 0 && (
            <button
              className="text-xs text-slate-400 border border-slate-700 rounded-lg px-2 py-1"
              onClick={() => markAll.mutate(category)}
            >
              すべて既読
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto px-4 pb-3 gap-2 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : data?.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {data?.items.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-sm">新しい情報はありません</p>
    </div>
  );
}
