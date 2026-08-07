import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import type { Home } from "@/lib/types";

export default async function HomesPage() {
  const supabase = await createClient();
  const { data: homes } = await supabase
    .from("homes")
    .select("*")
    .order("created_at");

  if (!homes || homes.length === 0) {
    redirect("/onboarding");
  }

  const counts = new Map<string, number>();
  for (const home of homes as Home[]) {
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("home_id", home.id);
    counts.set(home.id, count ?? 0);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes maisons</h1>
        <LogoutButton />
      </div>

      <div className="space-y-3">
        {(homes as Home[]).map((home) => (
          <Link
            key={home.id}
            href={`/homes/${home.id}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <span className="text-3xl">{home.icon ?? "🏠"}</span>
            <div className="flex-1">
              <p className="font-semibold">{home.name}</p>
              <p className="text-sm text-muted">
                {counts.get(home.id)} objet{(counts.get(home.id) ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-muted">›</span>
          </Link>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="mt-4 block rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted"
      >
        + Ajouter une maison
      </Link>
    </div>
  );
}
