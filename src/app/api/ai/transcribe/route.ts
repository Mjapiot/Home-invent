import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

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
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "fr",
    });
    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    console.error("transcribe error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la transcription" },
      { status: 500 }
    );
  }
}
