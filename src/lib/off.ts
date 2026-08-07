import type { ProductLookup } from "@/lib/types";

const USER_AGENT = "InventaireMaison/1.0 (webapp inventaire domestique)";
const FIELDS =
  "product_name,product_name_fr,brands,image_front_url,quantity,categories_tags";

type OffSource = {
  host: string;
  source: string;
  defaultCategory: string;
};

const SOURCES: OffSource[] = [
  {
    host: "world.openfoodfacts.org",
    source: "openfoodfacts",
    defaultCategory: "alimentaire",
  },
  {
    host: "world.openproductsfacts.org",
    source: "openproductsfacts",
    defaultCategory: "autre",
  },
  {
    host: "world.openbeautyfacts.org",
    source: "openbeautyfacts",
    defaultCategory: "hygiene-beaute",
  },
];

function suggestCategory(tags: string[], fallback: string): string {
  const joined = tags.join(" ");
  if (/beverage|boisson|wine|vin|juice|water|soda|beer|biere/.test(joined))
    return "boissons";
  if (/hygiene|beauty|cosmetic|shampoo|soap|savon/.test(joined))
    return "hygiene-beaute";
  if (/cleaning|detergent|entretien|lessive/.test(joined)) return "entretien";
  if (/medic|pharma|sante/.test(joined)) return "medicaments";
  return fallback;
}

export function isValidEan(code: string): boolean {
  return /^\d{8}$|^\d{13}$/.test(code);
}

export async function lookupBarcode(
  ean: string
): Promise<ProductLookup | null> {
  for (const { host, source, defaultCategory } of SOURCES) {
    try {
      const res = await fetch(
        `https://${host}/api/v2/product/${ean}?fields=${FIELDS}`,
        {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 1 || !data.product) continue;

      const p = data.product;
      const tags: string[] = p.categories_tags ?? [];
      return {
        name: p.product_name_fr || p.product_name || null,
        brand: p.brands ? String(p.brands).split(",")[0].trim() : null,
        imageUrl: p.image_front_url || null,
        quantityText: p.quantity || null,
        suggestedCategoryId: suggestCategory(tags, defaultCategory),
        source,
      };
    } catch {
      // timeout ou réseau : on tente la source suivante
      continue;
    }
  }
  return null;
}
