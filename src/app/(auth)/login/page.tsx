"use client";

import { useState } from "react";
import { House } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Connexion par email + mot de passe : les utilisateurs sont créés dans le
// dashboard Supabase (Authentication → Users → Add user), pas d'inscription
// publique — l'app est mono-utilisateur.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError("Email ou mot de passe incorrect");
    } else {
      window.location.href = "/homes";
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-white shadow-lg shadow-accent/30">
            <House size={30} />
          </div>
          <h1 className="text-2xl font-bold">Inventaire Maison</h1>
          <p className="mt-2 text-sm text-muted">
            Sachez toujours ce que vous avez en stock, chez vous comme en
            vacances.
          </p>
        </div>

        <form onSubmit={signIn} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="card-shadow w-full rounded-2xl bg-card px-4 py-3.5 text-base outline-none ring-accent focus:ring-2"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="card-shadow w-full rounded-2xl bg-card px-4 py-3.5 text-base outline-none ring-accent focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-danger">{error}</p>
        )}
      </div>
    </main>
  );
}
