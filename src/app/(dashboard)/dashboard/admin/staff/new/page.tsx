import { NewStaffFormClient } from "@/modules/admin/components/new-staff-form";

export const metadata = {
  title: "Dar de Alta Staff | K'anPro Admin",
  description: "Registro de nuevo personal administrativo y asignación de credenciales y permisos en K'anPro.",
};

export default function AdminNewStaffPage() {
  return <NewStaffFormClient />;
}
