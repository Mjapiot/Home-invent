import { NextResponse } from "next/server";
import {
  getGemini,
  EXTRACTION_MODEL,
  EXTRACTION_RESPONSE_SCHEMA,
  extractionSystemPrompt,
} from "@/lib/gemini";
import { ExtractionResultSchema, toDraftItem } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

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

  const { transcript, homeName, roomName } = await request.json();
  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Transcript manquant" }, { status: 400 });
  }

  try {
    const response = await getGemini().models.generateContent({
      model: EXTRACTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Transcription de la dictée :\n\n${transcript}` }],
        },
      ],
      config: {
        systemInstruction: extractionSystemPrompt({
          homeName,
          roomName,
          mode: "voice",
        }),
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_RESPONSE_SCHEMA,
      },
    });

    const parsed = ExtractionResultSchema.safeParse(
      JSON.parse(response.text ?? "{}")
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Extraction impossible pour cette dictée" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      items: parsed.data.items.map(toDraftItem),
    });
  } catch (err) {
    console.error("extract-items error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction des produits" },
      { status: 500 }
    );
  }
}
