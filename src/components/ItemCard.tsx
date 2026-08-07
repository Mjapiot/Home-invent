import Link from "next/link";
import ExpiryBadge from "@/components/ExpiryBadge";
import type { Item, Category } from "@/lib/types";

export default function ItemCard({
  item,
  category,
  photoUrl,
}: {
  item: Item;
  category?: Category | null;
  photoUrl?: string | null;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-12 w-12 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-xl">
          {category?.icon ?? "📦"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="truncate text-sm text-muted">
          {item.quantity} {item.unit}
          {item.brand ? ` · ${item.brand}` : ""}
          {item.status === "low" ? " · stock bas" : ""}
          {item.status === "out" ? " · épuisé" : ""}
        </p>
      </div>
      <ExpiryBadge date={item.expiry_date} />
    </Link>
  );
}
