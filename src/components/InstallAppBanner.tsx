import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import adminIcon from "@/assets/admin-icon-192.png.asset.json";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (standalone || sessionStorage.getItem("install-dismissed") === "1") return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    if (ios) setHidden(false);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setHidden(true);
    } else if (isIos) {
      setShowIosHelp(true);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem("install-dismissed", "1");
    setHidden(true);
  };

  return (
    <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-2.5 flex items-center gap-3 shadow-md">
      <img src={adminIcon.url} alt="" className="w-8 h-8 rounded-lg" />
      <div className="flex-1 min-w-0 text-xs sm:text-sm font-bold">
        {showIosHelp
          ? "Toque em Compartilhar e depois em \"Adicionar à Tela de Início\"."
          : "Instale o painel como app no seu celular"}
      </div>
      {!showIosHelp && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
        >
          <Download className="w-4 h-4" /> Instalar
        </button>
      )}
      <button onClick={dismiss} aria-label="Fechar" className="p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
