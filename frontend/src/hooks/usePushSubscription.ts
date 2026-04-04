import { useState, useEffect } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

/**
 * GitHub Pages 版: サーバーなしのブラウザ通知 API のみ。
 * アプリを開いた際に新着アイテムがあれば Notification を表示する。
 */
export function useBrowserNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async () => {
    if (typeof Notification === "undefined") {
      setError("このブラウザは通知に対応していません");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "denied") {
        setError("通知がブロックされています。ブラウザの設定から許可してください。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return { permission, loading, error, request };
}

export function showBrowserNotification(title: string, body: string, url?: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: `${import.meta.env.BASE_URL}icons/192.png`,
    badge: `${import.meta.env.BASE_URL}icons/192.png`,
  });
  if (url) n.onclick = () => { window.open(url, "_blank"); };
}
