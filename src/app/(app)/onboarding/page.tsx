"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROOM_TEMPLATE = [
  { name: "Cuisine", icon: "🍳" },
  { name: "Salon", icon: "🛋️" },
  { name: "Chambre", icon: "🛏️" },
  { name: "Salle de bain", icon: "🛁" },
  { name: "Garage", icon: "🚗" },
  { name: "Cave", icon: "🍷" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("Maison principale");
  const [icon, setIcon] = useState("🏠");
  const [rooms, setRooms] = useState(
    ROOM_TEMPLATE.map((r) => ({ ...r, selected: true }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createHome(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: home, error: homeError } = await supabase
      .from("homes")
      .insert({ name, icon, user_id: user.id })
      .select()
      .single();

    if (homeError || !home) {
      setError("Impossible de créer la maison");
      setLoading(false);
      return;
    }

    const selectedRooms = rooms
      .filter((r) => r.selected)
      .map((r, i) => ({
        home_id: home.id,
        user_id: user.id,
        name: r.name,
        icon: r.icon,
        sort_order: i,
      }));

    if (selectedRooms.length > 0) {
      await supabase.from("rooms").insert(selectedRooms);
    }

    router.push(`/homes/${home.id}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Bienvenue 👋</h1>
      <p className="mb-6 text-sm text-muted">
        Créez votre première maison et ses pièces.
      </p>

      <form onSubmit={createHome} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nom de la maison
          </label>
          <div className="flex gap-2">
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-3 text-xl"
            >
              {["🏠", "🏡", "🏖️", "🏔️", "🏢"].map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Pièces</label>
          <div className="grid grid-cols-2 gap-2">
            {rooms.map((room, idx) => (
              <button
                key={room.name}
                type="button"
                onClick={() =>
                  setRooms((rs) =>
                    rs.map((r, i) =>
                      i === idx ? { ...r, selected: !r.selected } : r
                    )
                  )
                }
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm ${
                  room.selected
                    ? "border-accent bg-accent-soft font-medium"
                    : "border-border bg-card text-muted"
                }`}
              >
                <span>{room.icon}</span> {room.name}
                {room.selected && <span className="ml-auto text-accent">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer ma maison"}
        </button>
      </form>
    </div>
  );
}
