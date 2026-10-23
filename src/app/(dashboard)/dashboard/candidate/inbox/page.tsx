import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsInboxView } from "@/modules/notifications/components/notifications-inbox-view";

export const dynamic = "force-dynamic";

export default async function CandidateInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NotificationsInboxView userId={user.id} />;
}
