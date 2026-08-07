"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ItemCard from "@/components/ItemCard";
import type { Category, Home, Item, Room } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [homeId, setHomeId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [homes, setHomes] = useState<Home[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    });
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("search_items", {
      q: query,
      p_home: homeId || null,
      p_room: roomId || null,
      p_cat: categoryId || null,
    });
    setResults((data ?? []) as Item[]);
    setLoading(false);
  }, [query, homeId, roomId, categoryId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSearch, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runSearch]);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const homeRooms = rooms.filter((r) => !homeId || r.home_id === homeId);
  const chipCls = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-sm ${
      active
        ? "bg-accent-soft font-semibold text-accent"
        : "card-shadow bg-card text-muted"
    }`;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Recherche</h1>

      <input
        type="search"
        placeholder="Pâtes, vin, robe, doliprane…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="card-shadow mb-3 w-full rounded-2xl bg-card px-4 py-3.5 outline-none ring-accent focus:ring-2"
      />

      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setHomeId("")} className={chipCls(!homeId)}>
          Toutes maisons
        </button>
        {homes.map((h) => (
          <button
            key={h.id}
            onClick={() => {
              setHomeId(h.id === homeId ? "" : h.id);
              setRoomId("");
            }}
            className={chipCls(homeId === h.id)}
          >
            {h.icon} {h.name}
          </button>
        ))}
      </div>

      {homeId && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {homeRooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoomId(r.id === roomId ? "" : r.id)}
              className={chipCls(roomId === r.id)}
            >
              {r.icon} {r.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id === categoryId ? "" : c.id)}
            className={chipCls(categoryId === c.id)}
          >
            {c.icon} {c.name_fr}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Recherche…</p>
      ) : results.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {query ? "Aucun résultat." : "Tapez une recherche ou filtrez."}
        </p>
      ) : (
        <div className="space-y-2">
          {results.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              category={catMap.get(item.category_id ?? "")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
