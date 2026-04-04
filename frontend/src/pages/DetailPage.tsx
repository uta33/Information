import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import SeverityBadge, { CategoryBadge } from "../components/notifications/SeverityBadge";
import { useMarkRead, useToggleSaved, type NotificationVM } from "../hooks/useNotifications";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function DetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const n = location.state?.notification as NotificationVM | undefined;

  const doMarkRead = useMarkRead();
  const doToggleSaved = useToggleSaved();

  useEffect(() => {
    if (n && !n.is_read) doMarkRead(n.id);
  }, [n?.id]);

  if (!n) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center text-slate-500">
        <p>情報が見つかりません</p>
      </div>
    );
  }

  const publishedDate = n.published_at
    ? format(new Date(n.published_at), "yyyy年M月d日 HH:mm", { locale: ja })
    : null;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate(-1)} className="text-slate-400 p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="flex-1 text-sm text-slate-400 truncate">{n.source_name}</span>
        <button
          onClick={() => doToggleSaved(n.id)}
          className={n.is_saved ? "text-yellow-400" : "text-slate-500"}
        >
          <svg className="w-6 h-6" fill={n.is_saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        {n.url && (
          <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m5-3h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <SeverityBadge severity={n.severity} />
          <CategoryBadge category={n.category} />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-50 leading-snug mb-3">{n.title}</h1>

        {/* CVSS bar */}
        {n.cvss_score != null && (
          <div className="bg-slate-900 rounded-xl p-4 mb-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">CVSSスコア</span>
              <span className={`text-lg font-bold font-mono ${
                n.cvss_score >= 9 ? "text-red-400" : n.cvss_score >= 7 ? "text-orange-400" : "text-yellow-400"
              }`}>
                {n.cvss_score.toFixed(1)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  n.cvss_score >= 9 ? "bg-red-500" : n.cvss_score >= 7 ? "bg-orange-500" : "bg-yellow-500"
                }`}
                style={{ width: `${(n.cvss_score / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Manager summary callout */}
        {(n.severity === "critical" || n.severity === "high") && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-slate-400 mb-2">📋 対応ポイント</p>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• 重要度: <span className={n.severity === "critical" ? "text-red-400 font-semibold" : "text-orange-400 font-semibold"}>{n.severity.toUpperCase()}</span></li>
              {n.cvss_score && n.cvss_score >= 9 && <li>• 対応期限: <span className="text-red-400 font-semibold">即時対応推奨</span></li>}
              <li>• 詳細は下記リンクを参照</li>
            </ul>
          </div>
        )}

        {/* Body */}
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">{n.body}</div>

        {/* Meta */}
        <div className="text-xs text-slate-600 space-y-1 border-t border-slate-800 pt-4">
          {publishedDate && <p>公開日: {publishedDate}</p>}
          <p>ソース: {n.source_name}</p>
          {n.external_id && <p>ID: {n.external_id}</p>}
        </div>

        {/* External link button */}
        {n.url && (
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            公式ページを開く
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m5-3h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
