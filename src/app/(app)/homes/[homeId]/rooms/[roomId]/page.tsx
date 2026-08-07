import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import ItemCard from "@/components/ItemCard";
import { signPhotoUrls } from "@/lib/photos";
import type { Item, Category } from "@/lib/types";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ homeId: string; roomId: string }>;
}) {
  const { homeId, roomId } = await params;
  const supabase = await createClient();

  const [{ data: room }, { data: home }, { data: items }, { data: categories }] =
    await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
      supabase.from("homes").select("*").eq("id", homeId).maybeSingle(),
      supabase
        .from("items")
        .select("*")
        .eq("room_id", roomId)
        .order("updated_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);

  if (!room || !home) notFound();

  const catMap = new Map(
    ((categories ?? []) as Category[]).map((c) => [c.id, c])
  );
  const photoUrls = await signPhotoUrls(
    supabase,
    ((items ?? []) as Item[]).map((i) => i.photo_path)
  );

  return (
    <div>
      <BackLink href={`/homes/${homeId}`} label={home.name} />
      <div className="mb-6 mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {room.icon} {room.name}
        </h1>
        <Link
          href={`/capture?home=${homeId}&room=${roomId}`}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30"
        >
          + Ajouter
        </Link>
      </div>

      {(items ?? []).length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          Aucun objet dans cette pièce pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2">
          {((items ?? []) as Item[]).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              category={catMap.get(item.category_id ?? "")}
              photoUrl={item.photo_path ? photoUrls.get(item.photo_path) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
