import { apiClient } from "../../../lib/api-client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushActions = {
  getPublicKey: async (): Promise<string> => {
    const res = await apiClient<{ publicKey: string }>("/push/public-key");
    return res.publicKey;
  },

  registerAndSubscribe: async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Web Push is not supported in this browser.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission was denied.");
        return false;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = await pushActions.getPublicKey();
      if (!publicKey) return false;

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      const subscriptionJSON = subscription.toJSON();

      await apiClient("/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscriptionJSON.endpoint,
          keys: subscriptionJSON.keys,
          userAgent: navigator.userAgent,
        }),
      });

      return true;
    } catch (err) {
      console.error("Failed to subscribe for web push notifications:", err);
      return false;
    }
  },

  unsubscribe: async (): Promise<void> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await apiClient("/push/unsubscribe", {
          method: "POST",
          body: JSON.stringify({ endpoint }),
        });
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  },

  sendTestPush: async (title: string = "Work Graph Push Test", message: string = "Push notifications are working smoothly!"): Promise<any> => {
    return apiClient("/push/test", {
      method: "POST",
      body: JSON.stringify({ title, message }),
    });
  },
};
