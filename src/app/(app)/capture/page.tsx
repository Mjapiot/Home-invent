import Link from "next/link";
import { Camera, ScanBarcode, Mic, PencilLine } from "lucide-react";

const MODES = [
  {
    href: "/capture/photo",
    Icon: Camera,
    title: "Photo",
    desc: "Photographiez une étagère, l'IA identifie les produits",
  },
  {
    href: "/capture/scan",
    Icon: ScanBarcode,
    title: "Scanner un code-barres",
    desc: "Produits alimentaires et autres produits avec EAN",
  },
  {
    href: "/capture/voice",
    Icon: Mic,
    title: "Dictée vocale",
    desc: "« Trois paquets de pâtes, deux bouteilles de vin… »",
  },
  {
    href: "/capture/manual",
    Icon: PencilLine,
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
            className="card-shadow flex items-center gap-4 rounded-3xl bg-card p-4"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <mode.Icon size={22} />
            </span>
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
