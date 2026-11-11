import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/modules/company/components/navigation/company-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { CompanyTopbar } from "@/modules/company/components/navigation/company-topbar";
import { CompanyBottomNav } from "@/modules/company/components/navigation/company-bottom-nav";
import { CompanyRouteGuard } from "@/modules/company/components/navigation/company-route-guard";
import { LegacyCompanyOwnerPrompt } from "@/modules/company/components/navigation/legacy-company-owner-prompt";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    userName,
    userInitials,
    role,
    plan,
    isImpersonated,
    enabledCompanyModules,
    userCompanies,
    activeCompany,
    activeCompanyId,
  } = await getDashboardSession();

  const isLegacyOwnerName = Boolean(
    role === "company" &&
      activeCompany?.companyName &&
      userName &&
      userName.trim().toLowerCase() === activeCompany.companyName.trim().toLowerCase()
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "21rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className={
        isImpersonated
          ? "h-[calc(100vh-49px)] overflow-hidden flex bg-sidebar"
          : "h-screen overflow-hidden flex bg-sidebar"
      }
    >
      <CompanySidebar variant="inset" enabledModules={enabledCompanyModules} />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <CompanyTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
          companies={userCompanies}
          activeCompanyId={activeCompanyId}
        />
        <ScrollArea className="flex-1 min-h-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 w-full">
            {isLegacyOwnerName && activeCompany && (
              <LegacyCompanyOwnerPrompt
                companyName={activeCompany.companyName}
                currentFullName={userName}
              />
            )}
            <CompanyRouteGuard enabledModules={enabledCompanyModules}>
              {children}
            </CompanyRouteGuard>
          </main>
        </ScrollArea>
        <CompanyBottomNav enabledModules={enabledCompanyModules} />
      </SidebarInset>
    </SidebarProvider>
  );
}
