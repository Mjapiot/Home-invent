"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddRoomButton({ homeId }: { homeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🚪");

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("rooms").insert({
      home_id: homeId,
      user_id: user.id,
      name,
      icon,
      sort_order: 99,
    });
    setOpen(false);
    setName("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-28 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border text-sm font-medium text-muted"
      >
        + Ajouter une pièce
      </button>
    );
  }

  return (
    <form
      onSubmit={addRoom}
      className="card-shadow col-span-2 space-y-2 rounded-3xl bg-card p-4"
    >
      <div className="flex gap-2">
        <select
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="rounded-2xl bg-background px-2 py-2 text-lg"
        >
          {["🚪", "🍳", "🛋️", "🛏️", "🛁", "🚗", "🍷", "🧺", "📚", "🧸"].map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <input
          autoFocus
          required
          placeholder="Nom de la pièce"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl bg-background px-3 py-2 outline-none ring-accent focus:ring-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-full bg-background py-2.5 text-sm font-medium text-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 rounded-full bg-accent py-2.5 text-sm font-semibold text-white"
        >
          Ajouter
        </button>
      </div>
    </form>
  );
}
