import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyActiveFounder } from "@/lib/supabase/founder";

export const instant = false;

export default async function HomePage() {
  const supabase = await createClient();
  const verification = await verifyActiveFounder(supabase);

  if (verification.isActiveFounder) {
    redirect("/dashboard");
  }

  redirect("/login");
}
