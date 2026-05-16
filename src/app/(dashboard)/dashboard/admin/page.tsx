import * as React from "react"
import { AdminHero } from "@/modules/admin/components/admin-hero"
import { PlatformStats } from "@/modules/admin/components/platform-stats"
import { RecentActivity } from "@/modules/admin/components/recent-activity"
import { ReportedContent } from "@/modules/admin/components/reported-content"

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-12 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminHero />

      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
            Métricas de la Plataforma
          </h2>
        </div>
        <PlatformStats />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <ReportedContent />
      </section>
    </div>
  )
}
