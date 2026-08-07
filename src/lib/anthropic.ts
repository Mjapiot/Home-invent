import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const EXTRACTION_MODEL = "claude-sonnet-5";

export function extractionSystemPrompt(context: {
  homeName?: string;
  roomName?: string;
  mode: "photo" | "voice";
}) {
  const location = [
    context.homeName ? `Maison : ${context.homeName}` : null,
    context.roomName ? `Pièce : ${context.roomName}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const source =
    context.mode === "photo"
      ? `Tu analyses la photo d'une étagère, d'un placard, d'un frigo ou d'une armoire dans une maison française. Liste chaque produit identifiable distinctement.`
      : `Tu analyses la transcription d'une dictée vocale en français décrivant des produits à inventorier. La transcription peut contenir des hésitations ("euh"), des nombres en toutes lettres ("trois boîtes") et des dates relatives ("périme fin mars" → dernier jour du mois, année en cours ou suivante si déjà passé).`;

  return `${source}

Règles :
- Regroupe les produits identiques en un seul item avec la quantité correspondante.
- La quantité compte les unités physiques, pas le poids : 500 g de pâtes = quantity 1, unit "paquet". Tu peux mettre le poids dans attributes ("poids": "500g").
- N'invente jamais une marque illisible ou non mentionnée : brand = null.
- Les dates au format français JJ/MM/AAAA doivent être converties en ISO YYYY-MM-DD.
- Pour les vêtements, mets taille/couleur/pointure dans attributes si visibles ou mentionnés.
- Si un produit est partiellement visible ou incertain, inclus-le quand même avec confidence "low" plutôt que de l'omettre.
- Les noms d'items sont en français, courts et naturels (ex : "Pâtes penne", "Vin rouge Bordeaux").
- Choisis la catégorie la plus adaptée dans l'énumération fournie.
${location ? `\nContexte : ${location}. Utilise-le pour affiner les catégories.` : ""}

Aujourd'hui : ${new Date().toISOString().slice(0, 10)}.`;
}
