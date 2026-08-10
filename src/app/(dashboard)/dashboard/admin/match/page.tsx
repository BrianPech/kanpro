import * as React from "react"
import { Handshake } from "lucide-react"

export default function AdminMatchPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-12 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Handshake className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Match Manual</h1>
          <p className="text-sm text-muted-foreground">
            Vinculación directa entre candidatos y vacantes.
          </p>
        </div>
      </div>
    </div>
  )
}
