"use client";

import { useEffect, useState } from "react";

// iOS n'a pas de beforeinstallprompt : on affiche une fois une sheet
// d'instruction « Partager → Sur l'écran d'accueil ».
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("a2hs-dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-lg px-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <p className="text-sm">
          <strong>Installez l&apos;app</strong> : touchez{" "}
          <span aria-label="Partager">
            ⎋
          </span>{" "}
          <strong>Partager</strong> puis «{" "}
          <strong>Sur l&apos;écran d&apos;accueil</strong> » pour un accès
          rapide et le scan caméra.
        </p>
        <button
          onClick={() => {
            localStorage.setItem("a2hs-dismissed", "1");
            setVisible(false);
          }}
          className="mt-3 w-full rounded-lg border border-border py-2 text-sm text-muted"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
