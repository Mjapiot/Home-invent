import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddRoomButton from "@/components/AddRoomButton";
import type { Room } from "@/lib/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const supabase = await createClient();

  const { data: home } = await supabase
    .from("homes")
    .select("*")
    .eq("id", homeId)
    .maybeSingle();
  if (!home) notFound();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("home_id", homeId)
    .order("sort_order");

  const { data: itemCounts } = await supabase
    .from("items")
    .select("room_id")
    .eq("home_id", homeId);

  const counts = new Map<string | null, number>();
  for (const row of itemCounts ?? []) {
    counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1);
  }

  return (
    <div>
      <Link href="/homes" className="text-sm text-muted">
        ‹ Maisons
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">
        {home.icon} {home.name}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {((rooms ?? []) as Room[]).map((room) => (
          <Link
            key={room.id}
            href={`/homes/${homeId}/rooms/${room.id}`}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="text-3xl">{room.icon ?? "🚪"}</div>
            <p className="mt-2 font-semibold">{room.name}</p>
            <p className="text-sm text-muted">
              {counts.get(room.id) ?? 0} objet{(counts.get(room.id) ?? 0) > 1 ? "s" : ""}
            </p>
          </Link>
        ))}
        <AddRoomButton homeId={homeId} />
      </div>
    </div>
  );
}
