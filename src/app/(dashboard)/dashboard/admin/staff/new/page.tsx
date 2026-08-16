import Link from "next/link";
import { NewStaffFormClient } from "./new-staff-form-client";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, UserPlusIcon } from "lucide-react";

export default async function AdminNewStaffPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div className="flex items-center gap-3">
          <Button render={<Link href="/dashboard/admin/staff" />} variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/40">
            <ArrowLeftIcon className="size-4" />
            <span>Volver a Administradores</span>
          </Button>
          <div className="h-5 w-px bg-border/40" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <UserPlusIcon className="size-5 text-purple-600" />
              <span>Dar de Alta a Nuevo Personal / Administrador</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete la información general y asigne los permisos necesarios para el nuevo miembro del equipo K’anPro.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <NewStaffFormClient />
    </div>
  );
}
