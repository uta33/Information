import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSources, createSource, updateSource, deleteSource, fetchNow, sendTestPush, type SourceCreate } from "../api/sources";
import { usePushSubscription } from "../hooks/usePushSubscription";
import type { SourceCategory, SourceType } from "../api/sources";

export default function SettingsPage() {
  return (
    <div className="min-h-full">
      <div className="px-4 pt-12 pb-4 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-bold">設定</h1>
      </div>
      <div className="divide-y divide-slate-800">
        <PushSection />
        <SourceSection />
      </div>
    </div>
  );
}

function PushSection() {
  const { subscribe, loading, error, subscribed } = usePushSubscription();

  return (
    <section className="px-4 py-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">プッシュ通知</h2>
      <p className="text-xs text-slate-500 mb-4">
        HIGH / CRITICAL のアラートが届いたとき、スマホへプッシュ通知を送信します。<br />
        スマホでChromeを開き、ホーム画面に追加（PWAインストール）してから設定してください。
      </p>
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <button
        onClick={subscribe}
        disabled={loading || subscribed}
        className="bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        {subscribed ? "✅ 通知を有効にしました" : loading ? "設定中..." : "🔔 通知を有効にする"}
      </button>
      {subscribed && (
        <button
          onClick={() => sendTestPush()}
          className="ml-3 text-xs text-slate-400 border border-slate-700 px-3 py-2 rounded-xl"
        >
          テスト送信
        </button>
      )}
    </section>
  );
}

function SourceSection() {
  const qc = useQueryClient();
  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: fetchSources });
  const createMut = useMutation({ mutationFn: createSource, onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }) });
  const deleteMut = useMutation({ mutationFn: deleteSource, onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }) });
  const toggleMut = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) => updateSource(id, { is_enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SourceCreate>({ name: "", url: "", type: "rss", category: "general", poll_interval_minutes: 30 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: "", url: "", type: "rss", category: "general", poll_interval_minutes: 30 }); } });
  };

  return (
    <section className="px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300">情報ソース</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-indigo-400 font-medium">
          {showForm ? "キャンセル" : "+ 追加"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-4 mb-4 space-y-3 border border-slate-800">
          <Field label="名前" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Anthropic Blog" />
          <Field label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://..." type="url" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">種類</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as SourceType })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="rss">RSS</option>
                <option value="cve">CVE (NVD)</option>
                <option value="jvn">JVN</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">カテゴリ</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as SourceCategory })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="security">🔐 Security</option>
                <option value="ai">🤖 AI</option>
                <option value="it">📰 IT</option>
                <option value="general">📌 General</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {createMut.isPending ? "追加中..." : "追加する"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {(sources ?? []).map((src) => (
          <div key={src.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-200 truncate">{src.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    src.type === "cve" ? "bg-red-950 text-red-400" :
                    src.type === "jvn" ? "bg-orange-950 text-orange-400" : "bg-slate-800 text-slate-500"
                  }`}>
                    {src.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate">{src.url}</p>
                {src.last_fetched_at && (
                  <p className="text-xs text-slate-600 mt-0.5">最終取得: {new Date(src.last_fetched_at).toLocaleString("ja-JP")}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => fetchNow(src.id)}
                  className="text-xs text-slate-500 border border-slate-700 px-2 py-1 rounded-lg"
                >
                  今すぐ
                </button>
                <button
                  onClick={() => toggleMut.mutate({ id: src.id, is_enabled: !src.is_enabled })}
                  className={`relative w-10 h-6 rounded-full transition-colors ${src.is_enabled ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${src.is_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <button onClick={() => deleteMut.mutate(src.id)} className="text-slate-600 hover:text-red-400 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {(sources ?? []).length === 0 && (
          <p className="text-sm text-slate-600 text-center py-6">
            ソースを追加してください
          </p>
        )}
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
      />
    </div>
  );
}
