import * as React from "react"
import { Users } from "lucide-react"

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-12 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión y directorio de usuarios registrados.
          </p>
        </div>
      </div>
    </div>
  )
}
