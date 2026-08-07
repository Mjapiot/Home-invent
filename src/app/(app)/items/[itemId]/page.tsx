import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpiryBadge from "@/components/ExpiryBadge";
import DeleteItemButton from "@/components/DeleteItemButton";
import { signPhotoUrls } from "@/lib/photos";
import type { Item } from "@/lib/types";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("items")
    .select("*, categories(name_fr, icon), rooms(name, icon), homes(name, icon)")
    .eq("id", itemId)
    .maybeSingle();
  if (!data) notFound();

  const item = data as Item & {
    categories: { name_fr: string; icon: string } | null;
    rooms: { name: string; icon: string } | null;
    homes: { name: string; icon: string } | null;
  };

  const photoUrls = await signPhotoUrls(supabase, [item.photo_path]);
  const photoUrl = item.photo_path ? photoUrls.get(item.photo_path) : null;

  return (
    <div>
      <Link
        href={item.room_id ? `/homes/${item.home_id}/rooms/${item.room_id}` : `/homes/${item.home_id}`}
        className="text-sm text-muted"
      >
        ‹ {item.rooms ? `${item.rooms.icon} ${item.rooms.name}` : item.homes?.name}
      </Link>

      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={item.name}
          className="mt-3 h-48 w-full rounded-2xl object-cover"
        />
      )}

      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {item.brand && <p className="text-muted">{item.brand}</p>}
        </div>
        <ExpiryBadge date={item.expiry_date} />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <Row label="Quantité" value={`${item.quantity} ${item.unit}`} />
        <Row
          label="Catégorie"
          value={item.categories ? `${item.categories.icon} ${item.categories.name_fr}` : "—"}
        />
        <Row
          label="Emplacement"
          value={`${item.homes?.icon ?? ""} ${item.homes?.name ?? ""}${
            item.rooms ? ` · ${item.rooms.icon} ${item.rooms.name}` : ""
          }`}
        />
        <Row
          label="État"
          value={
            item.status === "in_stock" ? "En stock" : item.status === "low" ? "Stock bas" : "Épuisé"
          }
        />
        {item.expiry_date && (
          <Row
            label="Péremption"
            value={new Date(item.expiry_date).toLocaleDateString("fr-FR")}
          />
        )}
        {item.barcode && <Row label="Code-barres" value={item.barcode} />}
        {Object.entries(item.attributes ?? {}).map(([k, v]) => (
          <Row key={k} label={k} value={v} />
        ))}
        {item.notes && <Row label="Notes" value={item.notes} />}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/items/${item.id}/edit`}
          className="flex-1 rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white"
        >
          Modifier
        </Link>
        <DeleteItemButton
          itemId={item.id}
          homeId={item.home_id}
          roomId={item.room_id}
          photoPath={item.photo_path}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="capitalize text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
