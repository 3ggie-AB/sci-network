import { api, asObject } from "@/lib/api";

export type BrowserPushState = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

type PublicKeyResponse = {
  public_key?: string;
};

const PUBLIC_KEY_STORAGE = "scinetwork.pushPublicKey";

export async function getBrowserPushState(): Promise<BrowserPushState> {
  if (!isBrowserPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!subscription,
  };
}

export async function enableBrowserPush(): Promise<BrowserPushState> {
  if (!isBrowserPushSupported()) {
    throw new Error("Browser tidak mendukung Web Push notification");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Izin notifikasi browser belum diberikan");
  }

  const publicKey = await fetchPublicKey();
  const registration = await navigator.serviceWorker.register("/push-sw.js");
  const readyRegistration = await navigator.serviceWorker.ready;
  const activeRegistration = readyRegistration ?? registration;
  let subscription = await activeRegistration.pushManager.getSubscription();
  const previousPublicKey = localStorage.getItem(PUBLIC_KEY_STORAGE);

  if (subscription && previousPublicKey && previousPublicKey !== publicKey) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api("/api/push/subscriptions", {
    method: "POST",
    json: subscription.toJSON(),
  });
  localStorage.setItem(PUBLIC_KEY_STORAGE, publicKey);

  return getBrowserPushState();
}

export async function disableBrowserPush(): Promise<BrowserPushState> {
  if (!isBrowserPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await api("/api/push/subscriptions", {
      method: "DELETE",
      json: { endpoint: subscription.endpoint },
    }).catch(() => null);
    await subscription.unsubscribe();
  }
  localStorage.removeItem(PUBLIC_KEY_STORAGE);

  return getBrowserPushState();
}

function isBrowserPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function fetchPublicKey(): Promise<string> {
  const response = await api<unknown>("/api/push/public-key");
  const data = asObject<PublicKeyResponse>(response);
  if (!data.public_key) {
    throw new Error("VAPID public key belum tersedia");
  }
  return data.public_key;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
