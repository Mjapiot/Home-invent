import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ItemForm from "@/components/ItemForm";
import type { Category, Home, Room } from "@/lib/types";

// Sert aussi de formulaire prérempli après un scan code-barres
// (params name/brand/category/image/barcode).
export default async function ManualCapturePage({
  searchParams,
}: {
  searchParams: Promise<{
    home?: string;
    room?: string;
    name?: string;
    brand?: string;
    category?: string;
    image?: string;
    barcode?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: homes }, { data: rooms }, { data: categories }] =
    await Promise.all([
      supabase.from("homes").select("*").order("created_at"),
      supabase.from("rooms").select("*").order("sort_order"),
      supabase.from("categories").select("*"),
    ]);

  return (
    <div>
      <Link href="/capture" className="text-sm text-muted">
        ‹ Ajouter
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">
        {sp.barcode ? "Produit scanné" : "Nouvel objet"}
      </h1>
      <ItemForm
        initial={{
          name: sp.name,
          brand: sp.brand ?? null,
          category_id: sp.category,
          barcode: sp.barcode ?? null,
          home_id: sp.home,
          room_id: sp.room ?? null,
          imageUrl: sp.image ?? null,
        }}
        homes={(homes ?? []) as Home[]}
        rooms={(rooms ?? []) as Room[]}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  );
}
