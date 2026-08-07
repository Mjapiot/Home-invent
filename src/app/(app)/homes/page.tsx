import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package, Clock, TriangleAlert, House } from "lucide-react";
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

  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);

  const [{ count: totalItems }, { count: expiringSoon }, { count: lowStock }] =
    await Promise.all([
      supabase.from("items").select("id", { count: "exact", head: true }),
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .not("expiry_date", "is", null)
        .lte("expiry_date", in30.toISOString().slice(0, 10)),
      supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .in("status", ["low", "out"]),
    ]);

  const counts = new Map<string, number>();
  for (const home of homes as Home[]) {
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("home_id", home.id);
    counts.set(home.id, count ?? 0);
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm capitalize text-muted">{today}</p>
          <h1 className="text-2xl font-bold">Bonjour 👋</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-accent p-4 text-white shadow-lg shadow-accent/30">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Package size={18} />
          </span>
          <p className="mt-3 text-2xl font-bold">{totalItems ?? 0}</p>
          <p className="text-sm text-white/80">Objets en stock</p>
        </div>
        <div className="card-shadow rounded-3xl bg-card p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Clock size={18} />
          </span>
          <p className="mt-3 text-2xl font-bold">{expiringSoon ?? 0}</p>
          <p className="text-sm text-muted">Périment bientôt</p>
        </div>
        <div className="card-shadow rounded-3xl bg-card p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft text-danger">
            <TriangleAlert size={18} />
          </span>
          <p className="mt-3 text-2xl font-bold">{lowStock ?? 0}</p>
          <p className="text-sm text-muted">Stock bas / épuisé</p>
        </div>
        <div className="card-shadow rounded-3xl bg-card p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <House size={18} />
          </span>
          <p className="mt-3 text-2xl font-bold">{homes.length}</p>
          <p className="text-sm text-muted">
            Maison{homes.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold">Mes maisons</h2>
      <div className="space-y-3">
        {(homes as Home[]).map((home) => (
          <Link
            key={home.id}
            href={`/homes/${home.id}`}
            className="card-shadow flex items-center gap-4 rounded-3xl bg-card p-4"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-2xl">
              {home.icon ?? "🏠"}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{home.name}</p>
              <p className="text-sm text-muted">
                {counts.get(home.id)} objet{(counts.get(home.id) ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
            <ChevronRight size={20} className="text-muted" />
          </Link>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="mt-4 block rounded-3xl border-2 border-dashed border-border p-4 text-center text-sm font-medium text-muted"
      >
        + Ajouter une maison
      </Link>
    </div>
  );
}
