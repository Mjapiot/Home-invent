"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackLink from "@/components/BackLink";
import { createClient } from "@/lib/supabase/client";
import { useCaptureStore } from "@/lib/capture-store";
import { CATEGORY_IDS, UNIT_IDS } from "@/lib/schemas";
import type { Home, Room, Category } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const { drafts, homeId, roomId, setContext, updateDraft, removeDraft, clear } =
    useCaptureStore();

  const [homes, setHomes] = useState<Home[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("homes").select("*").order("created_at"),
      supabase.from("rooms").select("*").order("sort_order"),
      supabase.from("categories").select("*"),
    ]).then(([h, r, c]) => {
      setHomes((h.data ?? []) as Home[]);
      setRooms((r.data ?? []) as Room[]);
      setCategories((c.data ?? []) as Category[]);
      if (!homeId && h.data?.length) {
        setContext(h.data[0].id, null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const homeRooms = rooms.filter((r) => r.home_id === homeId);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  async function saveAll() {
    if (!homeId || drafts.length === 0) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("items").insert(
      drafts.map((d) => ({
        user_id: user.id,
        home_id: homeId,
        room_id: roomId || null,
        category_id: d.category_id,
        name: d.name,
        brand: d.brand,
        quantity: d.quantity,
        unit: d.unit,
        expiry_date: d.expiry_date,
        attributes: d.attributes,
      }))
    );

    if (insertError) {
      setError("Enregistrement impossible");
      setSaving(false);
      return;
    }

    clear();
    router.push(roomId ? `/homes/${homeId}/rooms/${roomId}` : `/homes/${homeId}`);
    router.refresh();
  }

  if (drafts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">Aucun produit à valider.</p>
        <Link href="/capture" className="mt-4 inline-block text-accent underline">
          Retour à l&apos;ajout
        </Link>
      </div>
    );
  }

  const selectCls =
    "rounded-xl bg-background px-2.5 py-1.5 text-sm outline-none";

  return (
    <div>
      <BackLink href="/capture" label="Ajouter" />
      <h1 className="mt-1 text-2xl font-bold">Vérifier avant d&apos;ajouter</h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        {drafts.length} produit{drafts.length > 1 ? "s" : ""} détecté
        {drafts.length > 1 ? "s" : ""} — corrigez ou supprimez avant validation.
      </p>

      <div className="mb-4 flex gap-2">
        <select
          value={homeId ?? ""}
          onChange={(e) => setContext(e.target.value, null)}
          className={`${selectCls} flex-1`}
        >
          {homes.map((h) => (
            <option key={h.id} value={h.id}>
              {h.icon} {h.name}
            </option>
          ))}
        </select>
        <select
          value={roomId ?? ""}
          onChange={(e) => setContext(homeId, e.target.value || null)}
          className={`${selectCls} flex-1`}
        >
          <option value="">Pièce : —</option>
          {homeRooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.icon} {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {drafts.map((draft, idx) => (
          <div
            key={idx}
            className={`card-shadow rounded-3xl bg-card p-3.5 ${
              draft.confidence === "low" ? "ring-2 ring-warning" : ""
            }`}
          >
            {draft.confidence === "low" && (
              <p className="mb-2 inline-block rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                Identification incertaine — vérifiez
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {catMap.get(draft.category_id)?.icon ?? "📦"}
              </span>
              <input
                value={draft.name}
                onChange={(e) => updateDraft(idx, { name: e.target.value })}
                className="w-full rounded-xl bg-background px-2.5 py-1.5 font-medium outline-none ring-accent focus:ring-2"
              />
              <button
                onClick={() => removeDraft(idx)}
                className="px-1 text-muted"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateDraft(idx, { quantity: Math.max(1, draft.quantity - 1) })
                  }
                  className="h-8 w-8 rounded-lg bg-background text-lg leading-none"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {draft.quantity}
                </span>
                <button
                  onClick={() => updateDraft(idx, { quantity: draft.quantity + 1 })}
                  className="h-8 w-8 rounded-lg bg-background text-lg leading-none"
                >
                  +
                </button>
              </div>
              <select
                value={draft.unit}
                onChange={(e) =>
                  updateDraft(idx, { unit: e.target.value as typeof draft.unit })
                }
                className={selectCls}
              >
                {UNIT_IDS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <select
                value={draft.category_id}
                onChange={(e) =>
                  updateDraft(idx, {
                    category_id: e.target.value as (typeof CATEGORY_IDS)[number],
                  })
                }
                className={selectCls}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name_fr}
                  </option>
                ))}
              </select>
            </div>
            {catMap.get(draft.category_id)?.tracks_expiry && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <label className="text-muted">Périme le</label>
                <input
                  type="date"
                  value={draft.expiry_date ?? ""}
                  onChange={(e) =>
                    updateDraft(idx, { expiry_date: e.target.value || null })
                  }
                  className={selectCls}
                />
              </div>
            )}
            {Object.keys(draft.attributes).length > 0 && (
              <p className="mt-2 text-xs text-muted">
                {Object.entries(draft.attributes)
                  .map(([k, v]) => `${k} : ${v}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <button
        onClick={saveAll}
        disabled={saving || !homeId}
        className="mt-6 w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-50"
      >
        {saving
          ? "Enregistrement…"
          : `Tout ajouter (${drafts.length})`}
      </button>
    </div>
  );
}
