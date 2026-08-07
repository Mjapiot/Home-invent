"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        window.location.href = "/login";
      }}
      className="text-sm text-muted underline"
    >
      Déconnexion
    </button>
  );
}
