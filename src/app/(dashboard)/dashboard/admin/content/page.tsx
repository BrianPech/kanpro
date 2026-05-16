import * as React from "react"
import { Shield } from "lucide-react"
import { ReportedContent } from "@/modules/admin/components/reported-content"

export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-10 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#e61e49]/10 text-[#e61e49] flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[28px] md:text-[36px] font-medium tracking-tighter leading-[1.0]">
              Moderación
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              Revisa y modera el contenido reportado en la plataforma
            </p>
          </div>
        </div>
      </div>

      <ReportedContent />
    </div>
  )
}
