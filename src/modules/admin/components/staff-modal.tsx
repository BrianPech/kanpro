"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  ShieldCheck,
  UserPlus,
  Trash2,
  KeyRound,
  Building2,
  Mail,
  Phone,
  Shield,
  Users,
  Briefcase,
  BarChart3,
  Settings2,
  X,
  Loader2,
  RotateCcw,
  CheckCheck,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  if (!name) return "AD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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

  const handleSelectAll = () => {
    setPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const handleResetRoleDefaults = () => {
    setPermissions(SUB_ROLE_LABELS[subRole].defaultPermissions);
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

  const validPermissionsCount = permissions.filter((p) =>
    ALL_PERMISSIONS.some((ap) => ap.key === p)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] rounded-3xl border-border/60 bg-card p-5 sm:p-7 flex flex-col gap-4 overflow-hidden shadow-2xl"
      >
        {/* Modal Header Bar */}
        <div className="border-b border-border/50 pb-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold border border-primary/20 shrink-0">
              <UserPlus className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground truncate">
                Dar de Alta a Nuevo Personal / Staff
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Configure la información general y asigne los permisos operativos para el nuevo miembro del equipo.
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between gap-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Personal Data & Role (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="create-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="create-name"
                    name="name"
                    required
                    placeholder="Ej. Ana María Gómez"
                    className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Correo Institucional *
                  </Label>
                  <Input
                    id="create-email"
                    name="email"
                    type="email"
                    required
                    placeholder="agomez@kanpro.com"
                    className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="create-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Teléfono
                    </Label>
                    <Input
                      id="create-phone"
                      name="whatsappNumber"
                      placeholder="+52 999 123 4567"
                      className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="create-department" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Departamento
                    </Label>
                    <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
                      <SelectTrigger id="create-department" className="h-10 w-full text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60 px-3">
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[280px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                        <SelectGroup>
                          {STAFF_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value} className="text-xs rounded-xl py-2 px-3 font-medium cursor-pointer">
                              <span className="font-bold">{dept.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Rol Administrativo *
                  </Label>
                  <Select value={subRole} onValueChange={(val) => handleSubRoleChange(val as AdminSubRole)}>
                    <SelectTrigger id="create-role" className="h-10 w-full text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60 px-3">
                      <SelectValue placeholder="Seleccionar rol de personal" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[280px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                      <SelectGroup>
                        {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                          <SelectItem key={key} value={key} className="text-xs rounded-xl py-2 px-3 font-medium cursor-pointer">
                            <span className="font-bold">{info.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="create-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notas u Observaciones
                  </Label>
                  <Textarea
                    id="create-notes"
                    name="notes"
                    placeholder="Detalles sobre responsabilidades, turnos o área asignada..."
                    className="text-xs rounded-xl bg-muted/30 border-border/60 min-h-[70px]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Permission Matrix (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-purple-600" />
                  <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Permisos Granulares
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold rounded-lg bg-card border-border/60 font-mono">
                    {validPermissionsCount} / {ALL_PERMISSIONS.length} Concedidos
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 px-2 text-[11px] font-bold text-primary gap-1 hover:bg-primary/10 rounded-lg cursor-pointer"
                  >
                    <CheckCheck className="size-3" />
                    <span>Todos</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetRoleDefaults}
                    className="h-7 px-2 text-[11px] font-bold text-muted-foreground gap-1 hover:bg-muted rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Restablecer</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = permissions.includes(perm.key);
                  const Icon = getPermissionIcon(perm.key);

                  return (
                    <label
                      key={perm.key}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition-all select-none",
                        isChecked
                          ? "border-primary/50 bg-primary/5 text-foreground shadow-2xs ring-1 ring-primary/20"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.key)}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("size-3.5 shrink-0", isChecked ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-extrabold text-foreground text-xs leading-tight">
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
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-4" />}
              <span>Dar de Alta Personal</span>
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
  
  // Ensure we only hold valid unique permissions
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(
    Array.from(new Set((staff.permissions || []).filter((p) => ALL_PERMISSIONS.some((ap) => ap.key === p))))
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

  const handleSelectAll = () => {
    setPermissions(ALL_PERMISSIONS.map((p) => p.key));
  };

  const handleResetRoleDefaults = () => {
    setPermissions(SUB_ROLE_LABELS[subRole].defaultPermissions);
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

  const validPermissionsCount = permissions.filter((p) =>
    ALL_PERMISSIONS.some((ap) => ap.key === p)
  ).length;

  const initials = getInitials(staff.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] rounded-3xl border-border/60 bg-card p-5 sm:p-7 flex flex-col gap-4 overflow-hidden shadow-2xl"
      >
        {/* Modal Header Bar */}
        <div className="border-b border-border/50 pb-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="size-11 rounded-2xl border border-border/60 bg-muted shrink-0">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground truncate">
                  {staff.name}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-bold rounded-lg border",
                    subRole === "super_admin"
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      : "bg-muted text-muted-foreground border-border/60"
                  )}
                >
                  {SUB_ROLE_LABELS[subRole]?.label || "Staff"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground truncate font-mono">
                {staff.email} • ID: {staff.profileId.slice(0, 8)}
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between gap-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Staff Details & Role / Status (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={staff.name}
                    required
                    className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Correo Electrónico *
                  </Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={staff.email}
                    required
                    className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Teléfono
                    </Label>
                    <Input
                      id="edit-phone"
                      name="whatsappNumber"
                      defaultValue={staff.whatsappNumber}
                      className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-dept" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Departamento
                    </Label>
                    <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
                      <SelectTrigger id="edit-dept" className="h-10 w-full text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60 px-3">
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[280px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                        <SelectGroup>
                          {STAFF_DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value} className="text-xs rounded-xl py-2 px-3 font-medium cursor-pointer">
                              <span className="font-bold">{dept.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Rol Administrativo
                    </Label>
                    <Select value={subRole} onValueChange={(val) => handleSubRoleChange(val as AdminSubRole)}>
                      <SelectTrigger id="edit-role" className="h-10 w-full text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60 px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[280px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                        <SelectGroup>
                          {Object.entries(SUB_ROLE_LABELS).map(([key, info]) => (
                            <SelectItem key={key} value={key} className="text-xs rounded-xl py-2 px-3 font-medium cursor-pointer">
                              <span className="font-bold">{info.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Estado del Acceso
                    </Label>
                    <Select value={status} onValueChange={(val) => setStatus(val as AdminStaffStatus)}>
                      <SelectTrigger id="edit-status" className="h-10 w-full text-xs sm:text-sm rounded-xl bg-muted/30 border-border/60 px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[200px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                        <SelectGroup>
                          <SelectItem value="active" className="text-xs text-emerald-600 font-bold rounded-xl py-2 px-3 cursor-pointer">
                            Activo
                          </SelectItem>
                          <SelectItem value="inactive" className="text-xs text-amber-600 font-bold rounded-xl py-2 px-3 cursor-pointer">
                            Inactivo
                          </SelectItem>
                          <SelectItem value="suspended" className="text-xs text-rose-600 font-bold rounded-xl py-2 px-3 cursor-pointer">
                            Suspendido
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Notas u Observaciones
                  </Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={staff.notes}
                    placeholder="Detalles sobre cambios de rol, motivos o asignaciones..."
                    className="text-xs rounded-xl bg-muted/30 border-border/60 min-h-[70px]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Permission Matrix (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-purple-600" />
                  <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Permisos Granulares
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold rounded-lg bg-card border-border/60 font-mono">
                    {validPermissionsCount} / {ALL_PERMISSIONS.length} Concedidos
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 px-2 text-[11px] font-bold text-primary gap-1 hover:bg-primary/10 rounded-lg cursor-pointer"
                  >
                    <CheckCheck className="size-3" />
                    <span>Todos</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetRoleDefaults}
                    className="h-7 px-2 text-[11px] font-bold text-muted-foreground gap-1 hover:bg-muted rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Restablecer</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = permissions.includes(perm.key);
                  const Icon = getPermissionIcon(perm.key);

                  return (
                    <label
                      key={perm.key}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-2xl border text-xs cursor-pointer transition-all select-none",
                        isChecked
                          ? "border-primary/50 bg-primary/5 text-foreground shadow-2xs ring-1 ring-primary/20"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.key)}
                        className="mt-0.5"
                      />
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("size-3.5 shrink-0", isChecked ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-extrabold text-foreground text-xs leading-tight">
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
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>Guardar Cambios</span>
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
      <AlertDialogContent className="rounded-3xl max-w-md p-6 border-border/60 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive font-extrabold text-base">
            <Trash2 className="size-5" />
            <span>Dar de Baja Acceso Administrativo</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
            ¿Está seguro de revocar el acceso administrativo a <strong className="text-foreground">{staff.name}</strong> ({staff.email})?
            <br /><br />
            El usuario perderá inmediatamente todos los permisos de administración y su rol volverá a ser de usuario básico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-2">
          <AlertDialogCancel disabled={loading} className="h-10 rounded-xl text-xs font-bold cursor-pointer">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="h-10 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold cursor-pointer shadow-xs"
          >
            {loading ? "Procesando..." : "Confirmar Baja"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
