import * as React from "react";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <div className="w-full min-h-screen bg-sidebar">{children}</div>;
}
