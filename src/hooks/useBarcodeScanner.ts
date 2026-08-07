"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Scan EAN-13/EAN-8 via getUserMedia + ponyfill BarcodeDetector (zxing-wasm).
// iOS : flux coupé quand l'app passe en arrière-plan → ré-acquisition sur
// visibilitychange ; <video> doit être playsinline muted autoplay.
export function useBarcodeScanner(onDetect: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef<{ value: string; hits: number }>({ value: "", hits: 0 });
  const stoppedRef = useRef(false);
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;

  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    stoppedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
        audio: false,
      });
      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setActive(true);

      // Import dynamique : le wasm zxing n'est chargé que sur cette page
      const { BarcodeDetector } = await import("barcode-detector/ponyfill");
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8"] });

      const loop = async () => {
        if (stoppedRef.current || !videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const code = codes[0]?.rawValue;
          if (code) {
            // Debounce : 2 frames consécutives identiques avant validation
            if (lastCodeRef.current.value === code) {
              lastCodeRef.current.hits += 1;
              if (lastCodeRef.current.hits >= 2) {
                stop();
                onDetectRef.current(code);
                return;
              }
            } else {
              lastCodeRef.current = { value: code, hits: 1 };
            }
          }
        } catch {
          // frame non décodable : on continue
        }
        setTimeout(loop, 100); // ~10 fps
      };
      loop();
    } catch {
      setError(
        "Impossible d'accéder à la caméra. Vérifiez les autorisations dans Réglages."
      );
    }
  }, [stop]);

  // Ré-acquisition du flux au retour au premier plan (iOS coupe le flux)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && active && !streamRef.current) {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, start, stop, error, active };
}
