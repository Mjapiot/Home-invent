"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, Square } from "lucide-react";
import BackLink from "@/components/BackLink";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCaptureStore } from "@/lib/capture-store";

function VoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDrafts, setContext } = useCaptureStore();
  const { start, stop, recording, seconds, error: micError } = useAudioRecorder();

  const [transcript, setTranscript] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "transcribing" | "extracting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function stopAndTranscribe() {
    const blob = await stop();
    if (!blob || blob.size === 0) return;
    setPhase("transcribing");
    setError(null);
    try {
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const formData = new FormData();
      formData.append("audio", new File([blob], `dictee.${ext}`, { type: blob.type }));
      const res = await fetch("/api/ai/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Transcription impossible");
      const { transcript } = await res.json();
      setTranscript(transcript);
      setPhase("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPhase("idle");
    }
  }

  async function extract() {
    if (!transcript) return;
    setPhase("extracting");
    setError(null);
    try {
      const res = await fetch("/api/ai/extract-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error("Extraction impossible");
      const { items } = await res.json();
      if (!items?.length) {
        setError("Aucun produit reconnu dans la dictée.");
        setPhase("idle");
        return;
      }
      setContext(searchParams.get("home"), searchParams.get("room"));
      setDrafts(items);
      router.push("/capture/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setPhase("idle");
    }
  }

  return (
    <div>
      <BackLink href="/capture" label="Ajouter" />
      <h1 className="mb-4 mt-1 text-2xl font-bold">Dictée</h1>

      <p className="mb-6 text-sm text-muted">
        Dictez ce que vous voulez inventorier : « trois boîtes de tomates
        pelées, deux bouteilles de vin rouge, un paquet de riz qui périme en
        juin… »
      </p>

      <div className="flex flex-col items-center gap-4 py-6">
        {recording ? (
          <>
            <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-danger text-white shadow-lg shadow-danger/40">
              <Mic size={36} />
            </div>
            <p className="font-mono text-lg">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </p>
            <button
              onClick={stopAndTranscribe}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 font-semibold text-white shadow-lg shadow-accent/30"
            >
              <Square size={16} fill="currentColor" /> Terminer
            </button>
          </>
        ) : phase === "transcribing" ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-muted">Transcription…</p>
          </>
        ) : (
          <button
            onClick={start}
            aria-label="Démarrer la dictée"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/40"
          >
            <Mic size={36} />
          </button>
        )}
      </div>

      {transcript !== null && phase !== "transcribing" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Transcription <span className="font-normal text-muted">(corrigez si besoin)</span>
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
            className="card-shadow w-full rounded-2xl bg-card px-4 py-3 outline-none ring-accent focus:ring-2"
          />
          <button
            onClick={extract}
            disabled={phase === "extracting" || !transcript.trim()}
            className="w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-50"
          >
            {phase === "extracting" ? "Extraction des produits…" : "Extraire les produits"}
          </button>
        </div>
      )}

      {(error || micError) && (
        <p className="mt-4 text-sm text-danger">{error ?? micError}</p>
      )}
    </div>
  );
}

export default function VoicePage() {
  return (
    <Suspense>
      <VoiceContent />
    </Suspense>
  );
}
