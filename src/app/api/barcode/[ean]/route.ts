import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidEan, lookupBarcode } from "@/lib/off";
import type { ProductLookup } from "@/lib/types";

export const maxDuration = 30;

const CACHE_MAX_AGE_DAYS = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ean: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { ean } = await params;
  if (!isValidEan(ean)) {
    return NextResponse.json({ error: "Code-barres invalide" }, { status: 400 });
  }

  // Cache partagé
  const { data: cached } = await supabase
    .from("product_cache")
    .select("payload, fetched_at")
    .eq("barcode", ean)
    .maybeSingle();

  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    if (ageMs < CACHE_MAX_AGE_DAYS * 24 * 3600 * 1000) {
      const payload = cached.payload as ProductLookup | null;
      if (!payload) {
        return NextResponse.json({ barcode: ean }, { status: 404 });
      }
      return NextResponse.json(payload);
    }
  }

  const product = await lookupBarcode(ean);

  // On met aussi les miss en cache (payload null) pour éviter de re-frapper OFF
  await supabase.from("product_cache").upsert({
    barcode: ean,
    source: product?.source ?? "miss",
    payload: product,
    fetched_at: new Date().toISOString(),
  });

  if (!product) {
    return NextResponse.json({ barcode: ean }, { status: 404 });
  }
  return NextResponse.json(product);
}
