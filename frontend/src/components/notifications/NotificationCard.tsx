import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { NotificationVM } from "../../hooks/useNotifications";
import SeverityBadge, { CategoryBadge } from "./SeverityBadge";
import { useMarkRead, useToggleSaved } from "../../hooks/useNotifications";

interface Props {
  notification: NotificationVM;
}

export default function NotificationCard({ notification: n }: Props) {
  const navigate = useNavigate();
  const doMarkRead = useMarkRead();
  const doToggleSaved = useToggleSaved();

  const timeAgo = n.published_at
    ? formatDistanceToNow(new Date(n.published_at), { addSuffix: true, locale: ja })
    : formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ja });

  const handleClick = () => {
    if (!n.is_read) doMarkRead(n.id);
    navigate(`/notification/${n.id}`, { state: { notification: n } });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    doToggleSaved(n.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3.5 border-b border-slate-800 active:bg-slate-800 transition-colors cursor-pointer ${
        n.is_read ? "opacity-60" : ""
      }`}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 mt-1.5">
        {!n.is_read ? (
          <div className={`w-2 h-2 rounded-full ${
            n.severity === "critical" ? "bg-red-500" :
            n.severity === "high" ? "bg-orange-500" :
            n.severity === "medium" ? "bg-yellow-500" : "bg-slate-600"
          }`} />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <SeverityBadge severity={n.severity} size="xs" />
          <CategoryBadge category={n.category} />
          <span className="text-xs text-slate-500 ml-auto">{timeAgo}</span>
        </div>
        <p className={`text-sm leading-snug mb-1 ${n.is_read ? "text-slate-400" : "text-slate-100 font-medium"}`}>
          {n.title}
        </p>
        {n.cvss_score != null && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
              <div
                className={`h-full rounded-full ${
                  n.cvss_score >= 9 ? "bg-red-500" : n.cvss_score >= 7 ? "bg-orange-500" : "bg-yellow-500"
                }`}
                style={{ width: `${(n.cvss_score / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">CVSS {n.cvss_score.toFixed(1)}</span>
          </div>
        )}
        <p className="text-xs text-slate-600 mt-0.5">{n.source_name}</p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`flex-shrink-0 p-1 mt-0.5 rounded transition-colors ${
          n.is_saved ? "text-yellow-400" : "text-slate-600 hover:text-slate-400"
        }`}
        aria-label={n.is_saved ? "保存済み" : "保存する"}
      >
        <svg className="w-5 h-5" fill={n.is_saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
