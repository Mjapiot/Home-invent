import { createClient } from "@/lib/supabase/server";
import TabBar from "@/components/TabBar";
import InstallPrompt from "@/components/InstallPrompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alertCount = 0;
  if (user) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 30);
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .not("expiry_date", "is", null)
      .lte("expiry_date", limitDate.toISOString().slice(0, 10));
    alertCount = count ?? 0;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg pt-safe">
      <main className="px-4 pb-28 pt-4">{children}</main>
      <TabBar alertCount={alertCount} />
      <InstallPrompt />
    </div>
  );
}
