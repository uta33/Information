import { useNotifications } from "../hooks/useNotifications";
import NotificationCard from "../components/notifications/NotificationCard";

export default function SavedPage() {
  const { items, isLoading } = useNotifications(undefined, true);

  return (
    <div className="min-h-full">
      <div className="px-4 pt-12 pb-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-bold">保存済み</h1>
        <p className="text-xs text-slate-500 mt-0.5">{items.length} 件</p>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <span className="text-4xl mb-3">🔖</span>
          <p className="text-sm">保存した記事はありません</p>
          <p className="text-xs mt-1">記事の ★ をタップして保存できます</p>
        </div>
      ) : (
        <div>
          {items.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
