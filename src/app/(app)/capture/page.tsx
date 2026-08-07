import Link from "next/link";

const MODES = [
  {
    href: "/capture/photo",
    icon: "📷",
    title: "Photo",
    desc: "Photographiez une étagère, l'IA identifie les produits",
  },
  {
    href: "/capture/scan",
    icon: "📱",
    title: "Scanner un code-barres",
    desc: "Produits alimentaires et autres produits avec EAN",
  },
  {
    href: "/capture/voice",
    icon: "🎙️",
    title: "Dictée vocale",
    desc: "« Trois paquets de pâtes, deux bouteilles de vin… »",
  },
  {
    href: "/capture/manual",
    icon: "✏️",
    title: "Saisie manuelle",
    desc: "Formulaire classique",
  },
] as const;

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ home?: string; room?: string }>;
}) {
  const { home, room } = await searchParams;
  const qs = new URLSearchParams();
  if (home) qs.set("home", home);
  if (room) qs.set("room", room);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ajouter des objets</h1>
      <div className="space-y-3">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={`${mode.href}${suffix}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <span className="text-3xl">{mode.icon}</span>
            <div>
              <p className="font-semibold">{mode.title}</p>
              <p className="text-sm text-muted">{mode.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
