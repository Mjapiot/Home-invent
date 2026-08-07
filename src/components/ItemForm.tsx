"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/image";
import { UNITS, type Category, type Home, type Item, type Room } from "@/lib/types";

export type ItemFormInitial = Partial<
  Pick<
    Item,
    | "name"
    | "brand"
    | "quantity"
    | "unit"
    | "category_id"
    | "barcode"
    | "expiry_date"
    | "notes"
    | "attributes"
    | "status"
    | "home_id"
    | "room_id"
  >
> & { imageUrl?: string | null };

export default function ItemForm({
  item,
  initial,
  homes,
  rooms,
  categories,
}: {
  item?: Item; // présent = édition
  initial?: ItemFormInitial;
  homes: Home[];
  rooms: Room[];
  categories: Category[];
}) {
  const router = useRouter();
  const base = item ?? initial;

  const [name, setName] = useState(base?.name ?? "");
  const [brand, setBrand] = useState(base?.brand ?? "");
  const [quantity, setQuantity] = useState(base?.quantity ?? 1);
  const [unit, setUnit] = useState(base?.unit ?? "pcs");
  const [homeId, setHomeId] = useState(base?.home_id ?? homes[0]?.id ?? "");
  const [roomId, setRoomId] = useState(base?.room_id ?? "");
  const [categoryId, setCategoryId] = useState(base?.category_id ?? "autre");
  const [barcode] = useState(base?.barcode ?? null);
  const [expiryDate, setExpiryDate] = useState(base?.expiry_date ?? "");
  const [notes, setNotes] = useState(base?.notes ?? "");
  const [status, setStatus] = useState(base?.status ?? "in_stock");
  const [attributes, setAttributes] = useState<[string, string][]>(
    Object.entries(base?.attributes ?? {})
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const homeRooms = rooms.filter((r) => r.home_id === homeId);

  useEffect(() => {
    if (roomId && !homeRooms.some((r) => r.id === roomId)) {
      setRoomId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]);

  const category = categories.find((c) => c.id === categoryId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      home_id: homeId,
      room_id: roomId || null,
      category_id: categoryId,
      name,
      brand: brand || null,
      quantity,
      unit,
      barcode,
      expiry_date: expiryDate || null,
      notes: notes || null,
      status,
      attributes: Object.fromEntries(
        attributes.filter(([k, v]) => k.trim() && v.trim())
      ),
    };

    let itemId = item?.id;
    if (item) {
      const { error } = await supabase
        .from("items")
        .update(payload)
        .eq("id", item.id);
      if (error) {
        setError("Enregistrement impossible");
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("items")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) {
        setError("Enregistrement impossible");
        setLoading(false);
        return;
      }
      itemId = data.id;
    }

    if (photoFile && itemId) {
      const blob = await downscaleImage(photoFile);
      const path = `${user.id}/${itemId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (!uploadError) {
        await supabase.from("items").update({ photo_path: path }).eq("id", itemId);
      }
    }

    router.push(roomId ? `/homes/${homeId}/rooms/${roomId}` : `/homes/${homeId}`);
    router.refresh();
  }

  const inputCls =
    "card-shadow w-full rounded-2xl bg-card px-4 py-3 outline-none ring-accent focus:ring-2";

  return (
    <form onSubmit={save} className="space-y-4">
      {initial?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={initial.imageUrl}
          alt=""
          className="mx-auto h-24 w-24 rounded-xl object-contain"
        />
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Nom *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Marque</label>
        <input value={brand ?? ""} onChange={(e) => setBrand(e.target.value)} className={inputCls} />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Quantité</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
              className="card-shadow h-12 w-12 rounded-2xl bg-card text-xl"
            >
              −
            </button>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="card-shadow h-12 w-full rounded-2xl bg-card text-center outline-none ring-accent focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="card-shadow h-12 w-12 rounded-2xl bg-card text-xl"
            >
              +
            </button>
          </div>
        </div>
        <div className="w-32">
          <label className="mb-1 block text-sm font-medium">Unité</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={`${inputCls} h-12 py-0`}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Catégorie</label>
        <select value={categoryId ?? "autre"} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name_fr}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Maison</label>
          <select value={homeId} onChange={(e) => setHomeId(e.target.value)} className={inputCls}>
            {homes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon} {h.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Pièce</label>
          <select value={roomId ?? ""} onChange={(e) => setRoomId(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {homeRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.icon} {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {category?.tracks_expiry && (
        <div>
          <label className="mb-1 block text-sm font-medium">Date de péremption</label>
          <input
            type="date"
            value={expiryDate ?? ""}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">État du stock</label>
        <div className="flex gap-2">
          {(
            [
              ["in_stock", "En stock"],
              ["low", "Stock bas"],
              ["out", "Épuisé"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`flex-1 rounded-full px-2 py-2.5 text-sm ${
                status === value
                  ? "bg-accent-soft font-semibold text-accent"
                  : "card-shadow bg-card text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Attributs <span className="font-normal text-muted">(taille, couleur…)</span>
        </label>
        {attributes.map(([k, v], idx) => (
          <div key={idx} className="mb-2 flex gap-2">
            <input
              placeholder="taille"
              value={k}
              onChange={(e) =>
                setAttributes((a) => a.map((p, i) => (i === idx ? [e.target.value, p[1]] : p)))
              }
              className="card-shadow w-1/3 rounded-2xl bg-card px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
            />
            <input
              placeholder="M"
              value={v}
              onChange={(e) =>
                setAttributes((a) => a.map((p, i) => (i === idx ? [p[0], e.target.value] : p)))
              }
              className="card-shadow flex-1 rounded-2xl bg-card px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setAttributes((a) => a.filter((_, i) => i !== idx))}
              className="px-2 text-muted"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAttributes((a) => [...a, ["", ""]])}
          className="text-sm text-accent"
        >
          + Ajouter un attribut
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Photo</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:font-medium file:text-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </div>

      {barcode && (
        <p className="text-xs text-muted">Code-barres : {barcode}</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || !homeId}
        className="w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-50"
      >
        {loading ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter à l'inventaire"}
      </button>
    </form>
  );
}
