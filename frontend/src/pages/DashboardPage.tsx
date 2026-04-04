import { useNavigate } from "react-router-dom";
import { useSummary, useNotifications } from "../hooks/useNotifications";
import NotificationCard from "../components/notifications/NotificationCard";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function DashboardPage() {
  const { data: summary } = useSummary();
  const { items: securityItems } = useNotifications("security");
  const { items: aiItems } = useNotifications("ai");
  const navigate = useNavigate();
  const today = format(new Date(), "M月d日（E）", { locale: ja });

  const urgentItems = securityItems.filter((n) => n.severity === "critical" || n.severity === "high").slice(0, 3);
  const topAiItems = aiItems.slice(0, 3);

  const lastUpdated = summary?.generated_at
    ? format(new Date(summary.generated_at), "HH:mm 更新", { locale: ja })
    : null;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">InfoWatch</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {today}{lastUpdated && <span className="ml-2 text-slate-600">· {lastUpdated}</span>}
            </p>
          </div>
          {(summary?.critical ?? 0) + (summary?.high ?? 0) > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              要対応 {(summary!.critical) + (summary!.high)}
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <SummaryCard
          icon="🔴"
          label="緊急対応"
          count={summary?.critical ?? 0}
          sub={`要確認 ${summary?.high ?? 0}件`}
          onClick={() => navigate("/inbox?tab=security")}
          accent="border-red-900 bg-red-950/40"
        />
        <SummaryCard
          icon="🤖"
          label="AI動向"
          count={summary?.ai_unread ?? 0}
          sub="最新情報"
          onClick={() => navigate("/inbox?tab=ai")}
          accent="border-purple-900 bg-purple-950/40"
        />
        <SummaryCard
          icon="🔐"
          label="セキュリティ"
          count={summary?.security_unread ?? 0}
          sub="CVE / JVN"
          onClick={() => navigate("/inbox?tab=security")}
          accent="border-orange-900 bg-orange-950/40"
        />
        <SummaryCard
          icon="📰"
          label="IT全般"
          count={summary?.it_unread ?? 0}
          sub="業界動向"
          onClick={() => navigate("/inbox?tab=it")}
          accent="border-sky-900 bg-sky-950/40"
        />
      </div>

      {/* Critical Alerts */}
      {urgentItems.length > 0 && (
        <section className="mb-2">
          <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-red-400">🔴 要対応アラート</h2>
            <button className="text-xs text-slate-500" onClick={() => navigate("/inbox?tab=security")}>すべて →</button>
          </div>
          {urgentItems.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </section>
      )}

      {/* AI Topics */}
      {topAiItems.length > 0 && (
        <section className="mb-2">
          <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-purple-400">🤖 今日のAIトピック</h2>
            <button className="text-xs text-slate-500" onClick={() => navigate("/inbox?tab=ai")}>すべて →</button>
          </div>
          {topAiItems.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </section>
      )}

      {summary?.total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <span className="text-4xl mb-3">📡</span>
          <p className="text-sm">データ収集中...</p>
          <p className="text-xs mt-1">GitHub Actions が毎時0分に自動収集します</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon, label, count, sub, onClick, accent,
}: {
  icon: string; label: string; count: number; sub: string;
  onClick: () => void; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-opacity active:opacity-70 ${accent}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-100">{count}</div>
      <div className="text-sm font-medium text-slate-300">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </button>
  );
}
