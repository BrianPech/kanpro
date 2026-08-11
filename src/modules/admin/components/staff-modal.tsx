"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  type AdminSubRole,
  type AdminStaffStatus,
  type AdminPermissionKey,
  type AdminStaffItem,
} from "@/modules/admin/types/staff";
import {
  createAdminStaffMember,
  updateAdminStaffMember,
  deleteAdminStaffMember,
} from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { ShieldCheckIcon, UserPlusIcon, Trash2Icon, KeyRoundIcon } from "lucide-react";

interface CreateStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateStaffModal({ open, onOpenChange, onSuccess }: CreateStaffModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [subRole, setSubRole] = React.useState<AdminSubRole>("ops_admin");
  const [department, setDepartment] = React.useState("Operaciones");
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(
    SUB_ROLE_LABELS.ops_admin.defaultPermissions
  );

  const handleSubRoleChange = (role: AdminSubRole) => {
    setSubRole(role);
    setPermissions(SUB_ROLE_LABELS[role].defaultPermissions);
    if (role === "super_admin") setDepartment("Dirección General");
    else if (role === "verification_admin") setDepartment("Validación y Expedientes");
    else if (role === "content_admin") setDepartment("Publicaciones y Vacantes");
    else if (role === "support") setDepartment("Atención al Usuario");
    else setDepartment("Operaciones");
  };

  const togglePermission = (key: AdminPermissionKey) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const notes = formData.get("notes") as string;

    try {
      await createAdminStaffMember({
        name,
        email,
        whatsappNumber,
        subRole,
        department,
        permissions,
        notes,
      });

      toast.success(`Personal ${name} registrado correctamente como ${SUB_ROLE_LABELS[subRole].label}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al dar de alta al nuevo personal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <UserPlusIcon className="size-5" />
            <span>Dar de Alta a Nuevo Personal / Administrador</span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete la información general y asigne los permisos necesarios para el nuevo miembro del equipo K’anPro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
          {/* Informacion basica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name" className="text-xs font-semibold">Nombre Completo *</Label>
              <Input id="create-name" name="name" required placeholder="Ej. Ana María Gómez" className="h-9 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-email" className="text-xs font-semibold">Correo Institucional *</Label>
              <Input id="create-email" name="email" type="email" required placeholder="agomez@kanpro.com" className="h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-phone" className="text-xs font-semibold">Teléfono / WhatsApp</Label>
              <Input id="create-phone" name="whatsappNumber" placeholder="+52 999 123 4567" className="h-9 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-department" className="text-xs font-semibold">Departamento / Área</Label>
              <Input
                id="create-department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej. Operaciones"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Sub Rol */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-role" className="text-xs font-semibold">Rol Administrativo *</Label>
            <Select value={subRole} onValueChange={(val) => handleSubRoleChange(val as AdminSubRole)}>
              <SelectTrigger id="create-role" className="h-9 text-xs">
                <SelectValue placeholder="Seleccionar rol de personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Permisos Granulares */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-purple-500" />
                <span className="text-xs font-bold text-foreground">Permisos Granulares Otorgados</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {permissions.length} de {ALL_PERMISSIONS.length} Asignados
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Seleccione individualmente las capacidades que tendrá este usuario dentro del sistema:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = permissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/30 bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => togglePermission(perm.key)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold leading-tight text-foreground">{perm.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-normal">{perm.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-notes" className="text-xs font-semibold">Notas u Observaciones</Label>
            <Textarea
              id="create-notes"
              name="notes"
              placeholder="Detalles sobre las responsabilidades o contratación de este miembro del personal..."
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              {loading ? "Guardando..." : "Dar de Alta Personal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditStaffModalProps {
  staff: AdminStaffItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditStaffModal({ staff, open, onOpenChange, onSuccess }: EditStaffModalProps) {
  if (!staff) return null;

  return (
    <EditStaffModalContent
      key={staff.profileId}
      staff={staff}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
}

function EditStaffModalContent({
  staff,
  open,
  onOpenChange,
  onSuccess,
}: {
  staff: AdminStaffItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [subRole, setSubRole] = React.useState<AdminSubRole>(staff.subRole);
  const [status, setStatus] = React.useState<AdminStaffStatus>(staff.status);
  const [department, setDepartment] = React.useState(staff.department);
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(staff.permissions || []);

  const togglePermission = (key: AdminPermissionKey) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const notes = formData.get("notes") as string;

    try {
      await updateAdminStaffMember(staff.profileId, {
        name,
        email,
        whatsappNumber,
        subRole,
        department,
        permissions,
        status,
        notes,
      });

      toast.success(`Personal ${name} actualizado correctamente`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar la información");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <ShieldCheckIcon className="size-5 text-purple-500" />
            <span>Editar Personal y Permisos: {staff.name}</span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Actualice la información, cambie el rol administrativo u otorgue/revoque permisos granulares.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold">Nombre Completo *</Label>
              <Input id="edit-name" name="name" defaultValue={staff.name} required className="h-9 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email" className="text-xs font-semibold">Correo Electrónico *</Label>
              <Input id="edit-email" name="email" type="email" defaultValue={staff.email} required className="h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone" className="text-xs font-semibold">Teléfono / WhatsApp</Label>
              <Input id="edit-phone" name="whatsappNumber" defaultValue={staff.whatsappNumber} className="h-9 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-dept" className="text-xs font-semibold">Departamento</Label>
              <Input id="edit-dept" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role" className="text-xs font-semibold">Rol Administrativo</Label>
              <Select value={subRole} onValueChange={(val) => setSubRole(val as AdminSubRole)}>
                <SelectTrigger id="edit-role" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-status" className="text-xs font-semibold">Estado del Acceso</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as AdminStaffStatus)}>
                <SelectTrigger id="edit-status" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="active" className="text-xs text-green-600 font-semibold">Activo</SelectItem>
                    <SelectItem value="inactive" className="text-xs text-amber-600 font-semibold">Inactivo</SelectItem>
                    <SelectItem value="suspended" className="text-xs text-red-600 font-semibold">Suspendido</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permisos Granulares */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRoundIcon className="size-4 text-purple-500" />
                <span className="text-xs font-bold text-foreground">Permisos Granulares Otorgados</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {permissions.length} de {ALL_PERMISSIONS.length} Asignados
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ALL_PERMISSIONS.map((perm) => {
                const isChecked = permissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border/30 bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => togglePermission(perm.key)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold leading-tight text-foreground">{perm.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-normal">{perm.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-notes" className="text-xs font-semibold">Notas u Observaciones</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              defaultValue={staff.notes}
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteStaffDialogProps {
  staff: AdminStaffItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteStaffDialog({ staff, open, onOpenChange, onSuccess }: DeleteStaffDialogProps) {
  const [loading, setLoading] = React.useState(false);

  if (!staff) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAdminStaffMember(staff.profileId);
      toast.success(`Acceso administrativo de ${staff.name} revocado correctamente`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al dar de baja al usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md p-6">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive font-bold">
            <Trash2Icon className="size-5" />
            <span>Dar de Baja Acceso Administrativo</span>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground pt-2">
            ¿Está seguro de revocar el acceso administrativo a <strong className="text-foreground">{staff.name}</strong> ({staff.email})?
            <br /><br />
            El usuario perderá inmediatamente todos los permisos de administración y su rol volverá a ser de usuario básico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-2">
          <AlertDialogCancel disabled={loading} className="text-xs font-semibold">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
          >
            {loading ? "Procesando..." : "Confirmar Baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
