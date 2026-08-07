import { NextResponse } from "next/server";
import { getGemini, EXTRACTION_MODEL } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

// Transcription via Gemini (multimodal audio) — pas besoin de Whisper.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Trop de requêtes IA, réessayez plus tard" },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Fichier audio manquant" }, { status: 400 });
  }
  if (audio.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio trop volumineux" }, { status: 413 });
  }

  try {
    const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
    // iOS enregistre en audio/mp4 (AAC), Chrome/Android en audio/webm —
    // Gemini accepte les deux en inlineData.
    const mimeType = audio.type || "audio/mp4";

    const response = await getGemini().models.generateContent({
      model: EXTRACTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            {
              text: "Transcris fidèlement cette dictée en français. Réponds uniquement avec la transcription, sans commentaire ni ponctuation ajoutée inutilement.",
            },
          ],
        },
      ],
    });

    const transcript = (response.text ?? "").trim();
    if (!transcript) {
      return NextResponse.json(
        { error: "Transcription vide" },
        { status: 422 }
      );
    }
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("transcribe error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la transcription" },
      { status: 500 }
    );
  }
}
