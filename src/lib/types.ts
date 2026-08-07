export type Home = {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  created_at: string;
};

export type Room = {
  id: string;
  home_id: string;
  user_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

export type Category = {
  id: string;
  name_fr: string;
  icon: string;
  tracks_expiry: boolean;
};

export type ItemStatus = "in_stock" | "low" | "out";

export type Item = {
  id: string;
  user_id: string;
  home_id: string;
  room_id: string | null;
  category_id: string | null;
  name: string;
  brand: string | null;
  quantity: number;
  unit: string;
  barcode: string | null;
  photo_path: string | null;
  expiry_date: string | null;
  notes: string | null;
  attributes: Record<string, string>;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export const UNITS = [
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

export type ProductLookup = {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  quantityText: string | null;
  suggestedCategoryId: string;
  source: string;
};
