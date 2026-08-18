import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "candidate";

  if (role === "admin") {
    redirect("/dashboard/admin");
  } else if (role === "company") {
    redirect("/dashboard/company");
  } else {
    redirect("/dashboard/candidate");
  }
}
