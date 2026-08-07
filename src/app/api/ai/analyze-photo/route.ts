import { NextResponse } from "next/server";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, EXTRACTION_MODEL, extractionSystemPrompt } from "@/lib/anthropic";
import { ExtractionResultSchema, toDraftItem } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

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

  const { image, homeName, roomName } = await request.json();
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image manquante" }, { status: 400 });
  }

  try {
    const response = await getAnthropic().messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 8192,
      system: extractionSystemPrompt({ homeName, roomName, mode: "photo" }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: "Liste tous les produits identifiables sur cette photo.",
            },
          ],
        },
      ],
      output_config: {
        format: zodOutputFormat(ExtractionResultSchema),
      },
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return NextResponse.json(
        { error: "Analyse impossible pour cette image" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      items: response.parsed_output.items.map(toDraftItem),
    });
  } catch (err) {
    console.error("analyze-photo error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de la photo" },
      { status: 500 }
    );
  }
}
