import { createClient } from "@/lib/supabase/server";
import ItemCard from "@/components/ItemCard";
import { signPhotoUrls } from "@/lib/photos";
import type { Category, Item } from "@/lib/types";

export default async function AlertsPage() {
  const supabase = await createClient();
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + 30);

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .not("expiry_date", "is", null)
      .lte("expiry_date", limitDate.toISOString().slice(0, 10))
      .order("expiry_date"),
    supabase.from("categories").select("*"),
  ]);

  const catMap = new Map(((categories ?? []) as Category[]).map((c) => [c.id, c]));
  const all = (items ?? []) as Item[];
  const photoUrls = await signPhotoUrls(supabase, all.map((i) => i.photo_path));

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().slice(0, 10);

  const groups: { title: string; items: Item[] }[] = [
    { title: "🔴 Périmé", items: all.filter((i) => i.expiry_date! < today) },
    {
      title: "🟠 Dans les 7 jours",
      items: all.filter((i) => i.expiry_date! >= today && i.expiry_date! <= in7Str),
    },
    {
      title: "🟡 Dans les 30 jours",
      items: all.filter((i) => i.expiry_date! > in7Str),
    },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Péremptions</h1>
      <p className="mb-6 text-sm text-muted">
        Aliments, boissons, médicaments et cosmétiques qui périment bientôt.
      </p>

      {all.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          🎉 Rien ne périme dans les 30 prochains jours.
        </p>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <section key={group.title} className="mb-6">
              <h2 className="mb-2 font-semibold">{group.title}</h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    category={catMap.get(item.category_id ?? "")}
                    photoUrl={item.photo_path ? photoUrls.get(item.photo_path) : null}
                  />
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
