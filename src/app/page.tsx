import { redirect } from "next/navigation";

// Le middleware redirige déjà "/" selon la session ; fallback serveur.
export default function Home() {
  redirect("/homes");
}
