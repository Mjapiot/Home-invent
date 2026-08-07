import Link from "next/link";
import ExpiryBadge from "@/components/ExpiryBadge";
import type { Item, Category } from "@/lib/types";

const STATUS_BADGE: Record<Item["status"], { label: string; cls: string } | null> = {
  in_stock: { label: "En stock", cls: "bg-success-soft text-success" },
  low: { label: "Stock bas", cls: "bg-warning-soft text-warning" },
  out: { label: "Épuisé", cls: "bg-danger-soft text-danger" },
};

export default function ItemCard({
  item,
  category,
  photoUrl,
}: {
  item: Item;
  category?: Category | null;
  photoUrl?: string | null;
}) {
  const badge = STATUS_BADGE[item.status];

  return (
    <Link
      href={`/items/${item.id}`}
      className="card-shadow flex items-center gap-3 rounded-3xl bg-card p-3"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-2xl bg-background object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background text-2xl">
          {category?.icon ?? "📦"}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="truncate text-sm text-muted">
          {item.quantity} {item.unit}
          {item.brand ? ` · ${item.brand}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <ExpiryBadge date={item.expiry_date} />
        {badge && (
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
      </div>
    </Link>
  );
}
