import { z } from "zod";

export const CATEGORY_IDS = [
  "alimentaire",
  "boissons",
  "medicaments",
  "hygiene-beaute",
  "entretien",
  "vetements",
  "linge",
  "bricolage",
  "electronique",
  "papeterie",
  "autre",
] as const;

export const UNIT_IDS = [
  "pcs",
  "paquet",
  "bouteille",
  "boite",
  "tube",
  "g",
  "kg",
  "ml",
  "L",
] as const;

// Forme retournée par l'IA (structured outputs) : les JSON schemas stricts
// n'acceptent pas les Record → attributes est un tableau de paires.
export const ExtractedItemSchema = z.object({
  name: z.string(),
  brand: z.string().nullable(),
  quantity: z.number(),
  unit: z.enum(UNIT_IDS),
  category_id: z.enum(CATEGORY_IDS),
  expiry_date: z
    .string()
    .nullable()
    .describe("Date ISO YYYY-MM-DD, ou null si inconnue"),
  attributes: z.array(
    z.object({
      name: z.string().describe("ex: taille, couleur, pointure, poids"),
      value: z.string(),
    })
  ),
  confidence: z.enum(["high", "medium", "low"]),
});

export const ExtractionResultSchema = z.object({
  items: z.array(ExtractedItemSchema),
});

export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// Forme utilisée par l'UI de review et la DB (attributes en objet).
export type DraftItem = {
  name: string;
  brand: string | null;
  quantity: number;
  unit: (typeof UNIT_IDS)[number];
  category_id: (typeof CATEGORY_IDS)[number];
  expiry_date: string | null;
  attributes: Record<string, string>;
  confidence: "high" | "medium" | "low";
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toDraftItem(item: ExtractedItem): DraftItem {
  return {
    name: item.name,
    brand: item.brand,
    quantity: item.quantity > 0 ? item.quantity : 1,
    unit: item.unit,
    category_id: item.category_id,
    expiry_date:
      item.expiry_date && ISO_DATE.test(item.expiry_date)
        ? item.expiry_date
        : null,
    attributes: Object.fromEntries(
      item.attributes.map((a) => [a.name, a.value])
    ),
    confidence: item.confidence,
  };
}
