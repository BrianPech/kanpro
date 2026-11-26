import * as React from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "AD";
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin();

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : undefined;
  const metadataAvatar =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";

  const userName =
    profile.full_name ||
    metadataName ||
    user.email?.split("@")[0] ||
    "Administrador";
  const userEmail = user.email || profile.email || "";
  const userAvatar = profile.avatar_url || metadataAvatar;
  const userInitials = getInitials(userName);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "246px",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className="h-screen overflow-hidden flex bg-sidebar"
    >
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden !bg-sidebar">
        <SiteHeader
          userId={user.id}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          userInitials={userInitials}
        />

        {/* Marco del área de trabajo */}
        <div className="flex-1 min-h-0 flex flex-col px-2 sm:px-3 pb-3 bg-sidebar">
          <div className="flex-1 min-h-0 flex flex-col rounded-[16px] border border-border bg-background overflow-hidden">
            <ScrollArea
              className="flex-1 min-h-0 w-full"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <main className="flex-1 flex flex-col p-4 md:p-6 lg:px-5 lg:py-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
