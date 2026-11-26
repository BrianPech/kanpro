"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  STAFF_DEPARTMENTS,
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
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCheck,
  KeyRound,
  Loader2,
  RotateCcw,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<AdminStaffStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

function getDepartmentLabel(value: string): string {
  return STAFF_DEPARTMENTS.find((d) => d.value === value)?.label || value;
}

function getInitials(name: string): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function getPermissionIcon(key: AdminPermissionKey) {
  switch (key) {
    case "manage_users":
      return Users;
    case "manage_companies":
      return Building2;
    case "verify_documents":
      return ShieldCheck;
    case "manage_vacancies":
      return Briefcase;
    case "analytics_access":
      return BarChart3;
    case "system_settings":
      return Settings2;
    default:
      return KeyRound;
  }
}

function PermissionMatrix({
  permissions,
  onToggle,
  onSelectAll,
  onReset,
}: {
  permissions: AdminPermissionKey[];
  onToggle: (key: AdminPermissionKey) => void;
  onSelectAll: () => void;
  onReset: () => void;
}) {
  const validCount = permissions.filter((p) =>
    ALL_PERMISSIONS.some((ap) => ap.key === p)
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            Permisos granulares
          </span>
          <Badge
            variant="outline"
            className="rounded-[6px] px-1.5 py-0 text-[11px] tabular-nums"
          >
            {validCount} / {ALL_PERMISSIONS.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="h-7 px-2 text-[11.5px] font-medium text-link gap-1 rounded-[6px] cursor-pointer"
          >
            <CheckCheck className="size-3.5" />
            <span>Todos</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-[11.5px] font-medium text-muted-foreground gap-1 rounded-[6px] cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Por rol</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_PERMISSIONS.map((perm) => {
          const isChecked = permissions.includes(perm.key);
          const Icon = getPermissionIcon(perm.key);
          return (
            <label
              key={perm.key}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-[10px] border text-[12px] cursor-pointer transition-colors select-none",
                isChecked
                  ? "border-primary/40 bg-sidebar-accent/60 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(perm.key)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isChecked ? "text-link" : "text-muted-foreground"
                    )}
                  />
                  <span className="font-medium text-foreground text-[12.5px] leading-tight">
                    {perm.label}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground leading-snug">
                  {perm.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

interface CreateStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateStaffModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateStaffModalProps) {
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
    else if (role === "verification_admin")
      setDepartment("Validación y Expedientes");
    else if (role === "content_admin")
      setDepartment("Publicaciones y Vacantes");
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
      toast.success(
        `${name} registrado como ${SUB_ROLE_LABELS[subRole].label}`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al dar de alta personal"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[96vw] md:max-w-4xl max-h-[90vh] rounded-[16px] border-border bg-card p-5 flex flex-col gap-4 overflow-hidden"
      >
        <div className="border-b border-border pb-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="size-9 rounded-[10px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <UserPlus className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-[16px] font-semibold text-foreground truncate">
                Nuevo miembro de staff
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground truncate">
                Configura datos generales, sub-rol y permisos de acceso.
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 flex flex-col justify-between gap-4 overflow-y-auto pr-0.5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor="create-name"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Nombre completo *
                </Label>
                <Input
                  id="create-name"
                  name="name"
                  required
                  placeholder="Ej. Ana María Gómez"
                  className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="create-email"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Correo institucional *
                </Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  required
                  placeholder="agomez@kanpro.com"
                  className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="create-phone"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="create-phone"
                    name="whatsappNumber"
                    placeholder="+52 999 123 4567"
                    className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="create-department"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Departamento
                  </Label>
                  <Select
                    value={department}
                    onValueChange={(val) => val && setDepartment(val)}
                  >
                    <SelectTrigger
                      id="create-department"
                      className="h-9 w-full text-[12.5px] rounded-[8px] bg-background border-control-border"
                    >
                      <SelectValue>{getDepartmentLabel(department)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] border-border bg-popover">
                      <SelectGroup>
                        {STAFF_DEPARTMENTS.map((dept) => (
                          <SelectItem
                            key={dept.value}
                            value={dept.value}
                            className="text-[12.5px]"
                          >
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="create-role"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Sub-rol administrativo *
                </Label>
                <Select
                  value={subRole}
                  onValueChange={(val) =>
                    val && handleSubRoleChange(val as AdminSubRole)
                  }
                >
                  <SelectTrigger
                    id="create-role"
                    className="h-9 w-full text-[12.5px] rounded-[8px] bg-background border-control-border"
                  >
                    <SelectValue>{SUB_ROLE_LABELS[subRole].label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[10px] border-border bg-popover">
                    <SelectGroup>
                      {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                        <SelectItem
                          key={key}
                          value={key}
                          className="text-[12.5px]"
                        >
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="create-notes"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Notas
                </Label>
                <Textarea
                  id="create-notes"
                  name="notes"
                  placeholder="Responsabilidades, turnos o área asignada..."
                  className="text-[12.5px] rounded-[8px] bg-background border-control-border min-h-[64px]"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <PermissionMatrix
                permissions={permissions}
                onToggle={togglePermission}
                onSelectAll={() =>
                  setPermissions(ALL_PERMISSIONS.map((p) => p.key))
                }
                onReset={() =>
                  setPermissions(SUB_ROLE_LABELS[subRole].defaultPermissions)
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Dar de alta</span>
            </Button>
          </div>
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

export function EditStaffModal({
  staff,
  open,
  onOpenChange,
  onSuccess,
}: EditStaffModalProps) {
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
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(
    Array.from(
      new Set(
        (staff.permissions || []).filter((p) =>
          ALL_PERMISSIONS.some((ap) => ap.key === p)
        )
      )
    )
  );

  const handleSubRoleChange = (role: AdminSubRole) => {
    setSubRole(role);
    setPermissions(SUB_ROLE_LABELS[role].defaultPermissions);
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
      toast.success(`Personal ${name} actualizado`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al actualizar información"));
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(staff.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[96vw] md:max-w-4xl max-h-[90vh] rounded-[16px] border-border bg-card p-5 flex flex-col gap-4 overflow-hidden"
      >
        <div className="border-b border-border pb-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-9 rounded-[10px] shrink-0 after:hidden">
              <AvatarImage
                src={staff.avatar}
                alt={staff.name}
                className="rounded-[10px] object-cover"
              />
              <AvatarFallback className="rounded-[10px] bg-sidebar-accent text-link font-semibold text-[12px]">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-[16px] font-semibold text-foreground truncate">
                  {staff.name}
                </DialogTitle>
                <Badge
                  variant={subRole === "super_admin" ? "secondary" : "outline"}
                  className="rounded-[6px] px-2 py-0 text-[11px] font-medium"
                >
                  {SUB_ROLE_LABELS[subRole]?.label || "Staff"}
                </Badge>
              </div>
              <DialogDescription className="text-[12px] text-muted-foreground truncate">
                {staff.email} · ID {staff.profileId.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 flex flex-col justify-between gap-4 overflow-y-auto pr-0.5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor="edit-name"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Nombre completo *
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={staff.name}
                  required
                  className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="edit-email"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Correo electrónico *
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={staff.email}
                  required
                  className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="edit-phone"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Teléfono
                  </Label>
                  <Input
                    id="edit-phone"
                    name="whatsappNumber"
                    defaultValue={staff.whatsappNumber}
                    className="h-9 text-[13px] rounded-[8px] bg-background border-control-border"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="edit-dept"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Departamento
                  </Label>
                  <Select
                    value={department}
                    onValueChange={(val) => val && setDepartment(val)}
                  >
                    <SelectTrigger
                      id="edit-dept"
                      className="h-9 w-full text-[12.5px] rounded-[8px] bg-background border-control-border"
                    >
                      <SelectValue>{getDepartmentLabel(department)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] border-border bg-popover">
                      <SelectGroup>
                        {STAFF_DEPARTMENTS.map((dept) => (
                          <SelectItem
                            key={dept.value}
                            value={dept.value}
                            className="text-[12.5px]"
                          >
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="edit-role"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Sub-rol
                  </Label>
                  <Select
                    value={subRole}
                    onValueChange={(val) =>
                      val && handleSubRoleChange(val as AdminSubRole)
                    }
                  >
                    <SelectTrigger
                      id="edit-role"
                      className="h-9 w-full text-[12.5px] rounded-[8px] bg-background border-control-border"
                    >
                      <SelectValue>{SUB_ROLE_LABELS[subRole].label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] border-border bg-popover">
                      <SelectGroup>
                        {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="text-[12.5px]"
                          >
                            {info.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="edit-status"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Estado
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(val) =>
                      val && setStatus(val as AdminStaffStatus)
                    }
                  >
                    <SelectTrigger
                      id="edit-status"
                      className="h-9 w-full text-[12.5px] rounded-[8px] bg-background border-control-border"
                    >
                      <SelectValue>{STATUS_LABELS[status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] border-border bg-popover">
                      <SelectGroup>
                        <SelectItem value="active" className="text-[12.5px]">
                          Activo
                        </SelectItem>
                        <SelectItem value="inactive" className="text-[12.5px]">
                          Inactivo
                        </SelectItem>
                        <SelectItem value="suspended" className="text-[12.5px]">
                          Suspendido
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="edit-notes"
                  className="text-[12px] font-medium text-muted-foreground"
                >
                  Notas
                </Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={staff.notes}
                  placeholder="Observaciones o cambios de rol..."
                  className="text-[12.5px] rounded-[8px] bg-background border-control-border min-h-[64px]"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <PermissionMatrix
                permissions={permissions}
                onToggle={togglePermission}
                onSelectAll={() =>
                  setPermissions(ALL_PERMISSIONS.map((p) => p.key))
                }
                onReset={() =>
                  setPermissions(SUB_ROLE_LABELS[subRole].defaultPermissions)
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>Guardar cambios</span>
            </Button>
          </div>
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

export function DeleteStaffDialog({
  staff,
  open,
  onOpenChange,
  onSuccess,
}: DeleteStaffDialogProps) {
  const [loading, setLoading] = React.useState(false);

  if (!staff) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAdminStaffMember(staff.profileId);
      toast.success(`Acceso administrativo de ${staff.name} revocado`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al revocar acceso"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[16px] max-w-md p-5 border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[16px] font-semibold text-foreground">
            Revocar acceso administrativo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[12.5px] text-muted-foreground pt-1 leading-relaxed">
            ¿Revocar los privilegios de{" "}
            <strong className="text-foreground">{staff.name}</strong> (
            {staff.email})? Perderá todos los permisos de administración y su
            cuenta pasará a rol básico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-2">
          <AlertDialogCancel
            disabled={loading}
            className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="h-8 px-3.5 rounded-[8px] bg-destructive text-destructive-foreground hover:opacity-90 text-[12.5px] font-semibold cursor-pointer"
          >
            {loading ? "Procesando..." : "Confirmar baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
