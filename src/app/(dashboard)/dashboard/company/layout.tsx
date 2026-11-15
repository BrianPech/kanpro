import * as React from "react";
import { redirect } from "next/navigation";
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

  if (role === "company" && (!userCompanies || userCompanies.length === 0)) {
    redirect("/onboarding");
  }

  const isLegacyOwnerName = Boolean(
    role === "company" &&
      activeCompany?.companyName &&
      userName &&
      userName.trim().toLowerCase() ===
        activeCompany.companyName.trim().toLowerCase()
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "246px",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className={
        isImpersonated
          ? "h-[calc(100vh-49px)] overflow-hidden flex bg-sidebar"
          : "h-screen overflow-hidden flex bg-sidebar"
      }
    >
      <CompanySidebar
        enabledModules={enabledCompanyModules}
        companies={userCompanies}
        activeCompanyId={activeCompanyId}
      />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-sidebar">
        <CompanyTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
          companies={userCompanies}
          activeCompanyId={activeCompanyId}
        />

        {/* Marco del área de trabajo */}
        <div className="flex-1 min-h-0 flex flex-col px-2 sm:px-3 pb-3">
          <div className="flex-1 min-h-0 flex flex-col rounded-[16px] border border-border bg-background overflow-hidden">
            <ScrollArea
              className="flex-1 min-h-0 w-full"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <main
                key={activeCompanyId ?? "default"}
                className="flex-1 flex flex-col p-4 md:p-6 lg:px-5 lg:py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 w-full"
              >
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
          </div>
        </div>

        <CompanyBottomNav enabledModules={enabledCompanyModules} />
      </SidebarInset>
    </SidebarProvider>
  );
}
