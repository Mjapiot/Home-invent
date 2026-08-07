import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddRoomButton from "@/components/AddRoomButton";
import BackLink from "@/components/BackLink";
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
      <BackLink href="/homes" label="Maisons" />
      <h1 className="mb-6 mt-1 text-2xl font-bold">
        {home.icon} {home.name}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {((rooms ?? []) as Room[]).map((room) => (
          <Link
            key={room.id}
            href={`/homes/${homeId}/rooms/${room.id}`}
            className="card-shadow rounded-3xl bg-card p-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-2xl">
              {room.icon ?? "🚪"}
            </span>
            <p className="mt-3 font-semibold">{room.name}</p>
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
