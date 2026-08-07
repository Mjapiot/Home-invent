"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteItemButton({
  itemId,
  homeId,
  roomId,
  photoPath,
}: {
  itemId: string;
  homeId: string;
  roomId: string | null;
  photoPath: string | null;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    const supabase = createClient();
    await supabase.from("items").delete().eq("id", itemId);
    if (photoPath) {
      await supabase.storage.from("item-photos").remove([photoPath]);
    }
    router.push(roomId ? `/homes/${homeId}/rooms/${roomId}` : `/homes/${homeId}`);
    router.refresh();
  }

  if (confirming) {
    return (
      <button
        onClick={remove}
        className="flex-1 rounded-2xl bg-danger px-4 py-3 font-semibold text-white"
      >
        Confirmer ?
      </button>
    );
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-2xl bg-danger-soft px-4 py-3 font-medium text-danger"
    >
      Supprimer
    </button>
  );
}
