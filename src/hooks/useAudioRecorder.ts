"use client";

import { useCallback, useRef, useState } from "react";

// MediaRecorder sans mimeType forcé : iOS produit audio/mp4 (AAC),
// Chrome/Android audio/webm — Whisper accepte les deux.
export function useAudioRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 120) {
            // cap 2 min
            recorder.stop();
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(
        "Impossible d'accéder au micro. Vérifiez les autorisations dans Réglages."
      );
    }
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        const type = recorder.mimeType || "audio/mp4";
        resolve(new Blob(chunksRef.current, { type }));
      };
      recorder.stop();
    });
  }, []);

  return { start, stop, recording, seconds, error };
}
