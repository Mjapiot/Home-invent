# 🏠 Inventaire Maison

PWA iOS-first pour inventorier vos maisons pièce par pièce, et savoir en un
coup d'œil ce qu'il reste en stock — chez vous comme dans la maison de
vacances.

**4 modes d'ajout** : 📷 photo analysée par IA (Claude Vision) · 📱 scan
code-barres (Open Food Facts) · 🎙️ dictée vocale (Whisper + Claude) · ✏️
saisie manuelle. **Recherche** tolérante aux accents/fautes, filtres par
maison/pièce/catégorie, et **alertes de péremption** (aliments, médicaments,
cosmétiques).

## Stack

Next.js 15 (App Router) · Supabase (Auth OTP, Postgres + RLS, Storage) ·
Anthropic API (`claude-sonnet-5`, structured outputs) · OpenAI Whisper ·
`barcode-detector` (zxing-wasm) · Serwist (service worker) · Tailwind 4.

## Mise en route

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez dans l'ordre les fichiers de
   `supabase/migrations/` (0001 → 0004). Le 0002 crée aussi le bucket privé
   `item-photos` et ses policies.
3. Dans **Authentication → Providers**, vérifiez que **Email** est activé
   (l'app utilise le code OTP envoyé par email).

### 2. Clés API

```bash
cp .env.example .env.local
```

Renseignez :

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Dashboard
  Supabase → Settings → API
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
  (analyse photo + extraction dictée)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)
  (transcription Whisper uniquement)

### 3. Lancer

```bash
npm install
npm run dev
```

> ⚠️ La caméra (scan) et le micro (dictée) exigent **HTTPS** — en local sur
> iPhone, utilisez `next dev --experimental-https` ou testez via le
> déploiement Vercel.

### 4. Déployer (Vercel)

```bash
npx vercel
```

Ajoutez les 4 variables d'environnement dans les settings du projet Vercel.
Ensuite, sur iPhone : ouvrez l'URL dans Safari → **Partager** → **Sur
l'écran d'accueil** pour installer la PWA (caméra plein écran, icône,
lancement standalone).

## Architecture

- `supabase/migrations/` — schéma, RLS (mono-utilisateur), index trgm pour la
  recherche française, RPC `search_items`, seed des catégories
- `src/app/(app)/capture/` — les 4 modes convergent vers `review/` (validation
  humaine avant toute insertion)
- `src/app/api/ai/*` — routes serveur (clés jamais exposées) : vision,
  transcription, extraction structurée (zod + `output_config.format`)
- `src/app/api/barcode/[ean]` — lookup Open Food Facts → Open Products Facts →
  Open Beauty Facts, avec cache partagé en DB (30 j, miss inclus)
- `src/app/sw.ts` — service worker Serwist (précache du shell, NetworkFirst)

## V2 envisagées

- Partage famille (invitations multi-comptes sur une maison)
- Web Push péremption (iOS 16.4+, PWA installée) via Edge Function + pg_cron
- Chat en langage naturel sur l'inventaire (« il reste du vin ? »)
- Décrément rapide (« j'ai consommé ») depuis l'écran de recherche
