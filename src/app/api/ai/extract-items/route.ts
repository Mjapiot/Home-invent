import { NextResponse } from "next/server";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, EXTRACTION_MODEL, extractionSystemPrompt } from "@/lib/anthropic";
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
    const response = await getAnthropic().messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 8192,
      system: extractionSystemPrompt({ homeName, roomName, mode: "voice" }),
      messages: [
        {
          role: "user",
          content: `Transcription de la dictée :\n\n${transcript}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(ExtractionResultSchema),
      },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json(
        { error: "Extraction impossible pour cette dictée" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      items: response.parsed_output.items.map(toDraftItem),
    });
  } catch (err) {
    console.error("extract-items error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'extraction des produits" },
      { status: 500 }
    );
  }
}
