import type { SupabaseClient } from "@supabase/supabase-js";

// Génère des signed URLs pour un lot de photo_path (bucket privé).
export async function signPhotoUrls(
  supabase: SupabaseClient,
  paths: (string | null)[]
): Promise<Map<string, string>> {
  const valid = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (valid.length === 0) return map;

  const { data } = await supabase.storage
    .from("item-photos")
    .createSignedUrls(valid, 3600);

  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      map.set(entry.path, entry.signedUrl);
    }
  }
  return map;
}
