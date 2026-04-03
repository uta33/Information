import { useState } from "react";
import { getVapidPublicKey, subscribePush } from "../api/sources";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("このブラウザはプッシュ通知に対応していません");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("通知の許可が必要です");

      const { public_key } = await getVapidPublicKey();
      const reg = await navigator.serviceWorker.ready;
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });

      const json = pushSub.toJSON();
      await subscribePush({
        endpoint: pushSub.endpoint,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
      setSubscribed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, error, subscribed };
}
