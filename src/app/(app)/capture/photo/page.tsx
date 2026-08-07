"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import { downscaleImage, blobToBase64 } from "@/lib/image";
import { useCaptureStore } from "@/lib/capture-store";

function PhotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDrafts, setContext } = useCaptureStore();

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(file: File) {
    setLoading(true);
    setError(null);
    setPreview(URL.createObjectURL(file));

    try {
      const blob = await downscaleImage(file);
      const base64 = await blobToBase64(blob);
      const res = await fetch("/api/ai/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Analyse impossible");
      }
      const { items } = await res.json();
      if (!items?.length) {
        setError("Aucun produit identifié sur cette photo. Réessayez de plus près.");
        setLoading(false);
        return;
      }
      setContext(searchParams.get("home"), searchParams.get("room"));
      setDrafts(items);
      router.push("/capture/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'analyse");
      setLoading(false);
    }
  }

  return (
    <div>
      <BackLink href="/capture" label="Ajouter" />
      <h1 className="mb-4 mt-1 text-2xl font-bold">Photo</h1>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="card-shadow w-full rounded-3xl" />
      ) : (
        <p className="mb-4 text-sm text-muted">
          Photographiez une étagère, un placard, un frigo ou une penderie.
          L&apos;IA identifie les produits visibles et vous les propose à
          l&apos;ajout — rien n&apos;est enregistré sans votre validation.
        </p>
      )}

      {loading ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Analyse de la photo en cours…</p>
        </div>
      ) : (
        <label className="mt-4 block">
          <span className="block w-full cursor-pointer rounded-2xl bg-accent px-4 py-3.5 text-center font-semibold text-white shadow-lg shadow-accent/30">
            {preview ? "Reprendre une photo" : "Prendre une photo"}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) analyze(file);
            }}
          />
        </label>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function PhotoPage() {
  return (
    <Suspense>
      <PhotoContent />
    </Suspense>
  );
}
