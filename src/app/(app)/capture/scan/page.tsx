"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import type { ProductLookup } from "@/lib/types";

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const home = searchParams.get("home");
  const room = searchParams.get("room");

  const [status, setStatus] = useState<"idle" | "scanning" | "lookup">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const { videoRef, start, error, active } = useBarcodeScanner(
    async (code) => {
      setStatus("lookup");
      setMessage(`Code ${code} détecté, recherche du produit…`);
      // bip de confirmation
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        osc.frequency.value = 1200;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch {}

      const qs = new URLSearchParams();
      if (home) qs.set("home", home);
      if (room) qs.set("room", room);
      qs.set("barcode", code);

      try {
        const res = await fetch(`/api/barcode/${code}`);
        if (res.ok) {
          const product: ProductLookup = await res.json();
          if (product.name) qs.set("name", product.name);
          if (product.brand) qs.set("brand", product.brand);
          if (product.imageUrl) qs.set("image", product.imageUrl);
          qs.set("category", product.suggestedCategoryId);
        } else {
          setMessage("Produit inconnu — saisie manuelle préremplie");
        }
      } catch {
        setMessage("Recherche impossible — saisie manuelle");
      }
      router.push(`/capture/manual?${qs.toString()}`);
    }
  );

  return (
    <div>
      <BackLink href="/capture" label="Ajouter" />
      <h1 className="mb-4 mt-1 text-2xl font-bold">Scanner</h1>

      <div className="card-shadow relative overflow-hidden rounded-3xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="aspect-[3/4] w-full object-cover"
        />
        {active && (
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-white/80" />
        )}
        {!active && status === "idle" && (
          <button
            onClick={() => {
              setStatus("scanning");
              start();
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white"
          >
            <span className="text-4xl">📷</span>
            <span className="rounded-full bg-accent px-6 py-3 font-semibold shadow-lg shadow-accent/40">
              Démarrer le scan
            </span>
          </button>
        )}
        {status === "lookup" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
            Recherche…
          </div>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <p className="mt-4 text-xs text-muted">
        Visez le code-barres EAN du produit. La recherche utilise Open Food
        Facts (alimentaire), Open Products Facts et Open Beauty Facts.
      </p>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanContent />
    </Suspense>
  );
}
