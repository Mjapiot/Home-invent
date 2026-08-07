import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import ItemForm from "@/components/ItemForm";
import type { Category, Home, Item, Room } from "@/lib/types";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: homes }, { data: rooms }, { data: categories }] =
    await Promise.all([
      supabase.from("items").select("*").eq("id", itemId).maybeSingle(),
      supabase.from("homes").select("*").order("created_at"),
      supabase.from("rooms").select("*").order("sort_order"),
      supabase.from("categories").select("*"),
    ]);

  if (!item) notFound();

  return (
    <div>
      <BackLink href={`/items/${itemId}`} label="Retour" />
      <h1 className="mb-6 mt-1 text-2xl font-bold">Modifier</h1>
      <ItemForm
        item={item as Item}
        homes={(homes ?? []) as Home[]}
        rooms={(rooms ?? []) as Room[]}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  );
}
