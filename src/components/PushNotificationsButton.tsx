import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { savePushToken } from "@/lib/push.functions";

const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'] as string | undefined;
const vapidKey = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'] as string | undefined;
const firebaseConfig = {
  apiKey: (import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'] as string) ?? "",
  projectId: (import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'] as string) ?? "",
  appId: appId ?? "",
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export function PushNotificationsButton() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted" && localStorage.getItem("push-enabled") === "1") {
      setEnabled(true);
    }
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      if (!firebaseConfig.apiKey || !vapidKey || !firebaseConfig.messagingSenderId) {
        toast.error("Notificações não configuradas.");
        return;
      }
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken, isSupported, onMessage } = await import("firebase/messaging");
      if (!("Notification" in window) || !(await isSupported())) {
        toast.error("Este aparelho não suporta notificações. No iPhone, instale o app na Tela de Início primeiro.");
        return;
      }
      if (window.top !== window.self) {
        toast.error("Abra o painel em uma aba própria ou no app instalado para ativar.");
        return;
      }
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão negada. Libere as notificações nas configurações do navegador.");
        return;
      }
      const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${new URLSearchParams(firebaseConfig)}`);
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
      if (!token) throw new Error("sem token");
      await savePushToken({ data: { token } });
      onMessage(messaging, (p) => toast.success(p.notification?.title ?? "Novo pedido", { description: p.notification?.body }));
      localStorage.setItem("push-enabled", "1");
      setEnabled(true);
      toast.success("Notificações ativadas neste aparelho!");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy}
      title={enabled ? "Notificações ativas" : "Ativar notificações de pedidos"}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg disabled:opacity-60"
    >
      {enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {enabled ? "Notificações ativas" : busy ? "Ativando..." : "Ativar notificações"}
    </button>
  );
}
