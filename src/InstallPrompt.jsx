import React, { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "pomodoro-pet-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "true";
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (isDismissed) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;

    if (isStandalone) return;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () =>
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    }
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch (e) {}
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    handleDismiss();
  };

  if (isDismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 p-4 pp-card flex items-center justify-between gap-3 shadow-lg"
      style={{ maxWidth: 460, margin: "0 auto", background: "#FFFDF9" }}
    >
      <div className="flex-1">
        <p className="font-extrabold text-sm text-[#4A2E35]">
          Install Pixel Pomodoro Pet
        </p>
        <p className="text-xs font-bold text-[#4A2E35] opacity-80 mt-0.5">
          {showIOSPrompt ? (
            <span className="flex items-center gap-1 flex-wrap">
              Tap <Share size={14} className="inline" /> then select{" "}
              <strong>"Add to Home Screen"</strong>
            </span>
          ) : (
            "Add to your home screen for quick access and full-screen mode!"
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {deferredPrompt && (
          <button className="pp-btn mint sm" onClick={handleInstallClick}>
            <Download size={14} /> Install
          </button>
        )}
        <button
          className="pp-btn cream sm"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
