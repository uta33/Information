import { useQuery } from "@tanstack/react-query";
import { fetchSources } from "../api/sources";
import { useBrowserNotification } from "../hooks/usePushSubscription";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function SettingsPage() {
  return (
    <div className="min-h-full">
      <div className="px-4 pt-12 pb-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-bold">設定</h1>
      </div>
      <div className="divide-y divide-slate-800">
        <NotificationSection />
        <SourceSection />
        <AboutSection />
      </div>
    </div>
  );
}

function NotificationSection() {
  const { permission, loading, error, request } = useBrowserNotification();

  return (
    <section className="px-4 py-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">通知</h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        ブラウザの通知を有効にすると、アプリを開いた際に未読の高重要度アラートを通知します。<br />
        <span className="text-slate-600">
          ※ バックグラウンドプッシュ通知にはサーバーが必要なため、この構成では対応していません。
        </span>
      </p>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {permission === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          通知が有効です
        </div>
      ) : permission === "denied" ? (
        <p className="text-xs text-red-400">
          通知がブロックされています。ブラウザのアドレスバー横のアイコンから設定を変更してください。
        </p>
      ) : (
        <button
          onClick={request}
          disabled={loading}
          className="bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          {loading ? "確認中..." : "🔔 通知を有効にする"}
        </button>
      )}
    </section>
  );
}

function SourceSection() {
  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: fetchSources });

  const categoryColor: Record<string, string> = {
    security: "bg-red-950 text-red-400 border-red-900",
    ai: "bg-purple-950 text-purple-400 border-purple-900",
    it: "bg-sky-950 text-sky-400 border-sky-900",
    general: "bg-slate-800 text-slate-400 border-slate-700",
  };
  const typeColor: Record<string, string> = {
    cve: "bg-red-950 text-red-400",
    jvn: "bg-orange-950 text-orange-400",
    rss: "bg-slate-800 text-slate-500",
  };
  const categoryLabel: Record<string, string> = { security: "🔐", ai: "🤖", it: "📰", general: "📌" };

  return (
    <section className="px-4 py-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-300">情報ソース</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            ソースを変更するには{" "}
            <code className="text-slate-500 bg-slate-800 px-1 rounded">frontend/public/data/sources.json</code>{" "}
            を編集してコミットしてください
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(sources ?? []).map((src, i) => (
          <div key={i} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-slate-200 truncate flex-1">
                {categoryLabel[src.category] ?? "📌"} {src.name}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${typeColor[src.type] ?? typeColor.rss}`}>
                {src.type.toUpperCase()}
              </span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${src.enabled ? "bg-emerald-500" : "bg-slate-600"}`} />
            </div>
            <p className="text-xs text-slate-600 truncate">{src.url}</p>
          </div>
        ))}
        {(sources ?? []).length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">ソースが見つかりません</p>
        )}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="px-4 py-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">このアプリについて</h2>
      <div className="space-y-2 text-xs text-slate-500">
        <p>📡 データは GitHub Actions により自動収集（毎時0分）</p>
        <p>💾 既読・保存の状態はこのデバイスの localStorage に保存されます</p>
        <p>📱 スマホで使う場合は「ホーム画面に追加」でPWAとしてインストールできます</p>
      </div>
    </section>
  );
}
