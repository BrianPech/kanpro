"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Users,
} from "@/components/ui/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  STAFF_DEPARTMENTS,
  type AdminSubRole,
  type AdminPermissionKey,
} from "@/modules/admin/types/staff";
import { createAdminStaffMember } from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Datos personales", desc: "Identidad y área" },
  { id: 2, label: "Credenciales", desc: "Contraseña inicial" },
  { id: 3, label: "Rol y permisos", desc: "Alcance operativo" },
  { id: 4, label: "Confirmación", desc: "Revisión y alta" },
];

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getDepartmentLabel(value: string): string {
  return STAFF_DEPARTMENTS.find((d) => d.value === value)?.label || value;
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

export function NewStaffFormClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  const [department, setDepartment] = React.useState("Operaciones");
  const [subRole, setSubRole] = React.useState<AdminSubRole>("ops_admin");
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(
    SUB_ROLE_LABELS.ops_admin.defaultPermissions
  );
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

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

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Ingresa el nombre completo del administrador.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        toast.error("Ingresa un correo institucional válido.");
        return;
      }
      if (!department.trim()) {
        toast.error("Selecciona un departamento.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!password || password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      await createAdminStaffMember({
        name,
        email,
        password,
        whatsappNumber,
        subRole,
        department,
        permissions,
        notes,
      });
      toast.success(`Personal ${name} registrado correctamente`);
      router.push("/dashboard/admin/staff");
      router.refresh();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al registrar el personal."));
    } finally {
      setSubmitting(false);
    }
  };

  const validPermissionsCount = permissions.filter((p) =>
    ALL_PERMISSIONS.some((ap) => ap.key === p)
  ).length;
  const passwordMatch =
    Boolean(password) && Boolean(confirmPassword) && password === confirmPassword;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-8">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            render={<Link href="/dashboard/admin/staff" />}
            aria-label="Volver a staff"
            className="size-8 rounded-[8px] border-control-border shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[24px] font-bold leading-[1.2] tracking-tight text-foreground truncate">
              Nuevo miembro de staff
            </h1>
            <p className="text-[12.5px] text-muted-foreground truncate">
              Registro de administrador con credenciales y permisos granulares
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-[6px] px-2 py-0.5 text-[11.5px] font-medium tabular-nums shrink-0"
        >
          Paso {currentStep} / 4
        </Badge>
      </div>

      {/* Stepper compacto */}
      <div className="bg-card border border-border rounded-[14px] p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  "px-2.5 py-2 rounded-[10px] border text-left transition-colors flex items-center gap-2.5",
                  isCurrent
                    ? "bg-sidebar-accent border-primary/30"
                    : isCompleted
                      ? "bg-background border-border cursor-pointer hover:bg-muted/40"
                      : "bg-muted/30 border-transparent opacity-60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "size-6 rounded-[6px] flex items-center justify-center font-semibold text-[11.5px] shrink-0 tabular-nums",
                    isCompleted
                      ? "bg-success text-success-foreground"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : step.id}
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-[12px] font-semibold truncate",
                      isCurrent ? "text-link" : "text-foreground"
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {step.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido por pasos */}
      <form onSubmit={handleSubmit}>
        <section className="bg-card border border-border rounded-[14px] p-5 space-y-4">
          {currentStep === 1 && (
            <>
              <div className="border-b border-border pb-3">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Información personal y contacto
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Datos de identidad y departamento asignado dentro de K&apos;anPro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <Label
                    htmlFor="step-name"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Nombre completo *
                  </Label>
                  <Input
                    id="step-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ana María Gómez Pérez"
                    autoFocus
                    className="h-9 rounded-[8px] bg-background border-control-border text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="step-email"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Correo institucional *
                  </Label>
                  <Input
                    id="step-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agomez@kanpro.com"
                    className="h-9 rounded-[8px] bg-background border-control-border text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="step-phone"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Teléfono / WhatsApp
                  </Label>
                  <Input
                    id="step-phone"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+52 999 123 4567"
                    className="h-9 rounded-[8px] bg-background border-control-border text-[13px]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label
                    htmlFor="step-department"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Departamento *
                  </Label>
                  <Select
                    value={department}
                    onValueChange={(val) => val && setDepartment(val)}
                  >
                    <SelectTrigger
                      id="step-department"
                      className="h-9 w-full rounded-[8px] bg-background border-control-border text-[13px]"
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
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="border-b border-border pb-3">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Credenciales de acceso
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Establece la contraseña inicial para el ingreso al panel administrativo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="step-password"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Contraseña inicial *
                  </Label>
                  <div className="relative">
                    <Input
                      id="step-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoFocus
                      className="h-9 pr-9 rounded-[8px] bg-background border-control-border text-[13px] font-mono"
                    />
                    <button
                      type="button"
                      aria-label="Mostrar u ocultar contraseña"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="step-confirm-password"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Confirmar contraseña *
                  </Label>
                  <Input
                    id="step-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="h-9 rounded-[8px] bg-background border-control-border text-[13px] font-mono"
                  />
                </div>
              </div>

              {confirmPassword && (
                <p
                  className={cn(
                    "text-[12px] font-medium",
                    passwordMatch
                      ? "text-success-foreground"
                      : "text-destructive"
                  )}
                >
                  {passwordMatch
                    ? "Las contraseñas coinciden."
                    : "Las contraseñas no coinciden."}
                </p>
              )}
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="border-b border-border pb-3">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Sub-rol y permisos granulares
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Elige el sub-rol base y ajusta los permisos específicos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label
                    htmlFor="step-role"
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
                      id="step-role"
                      className="h-9 w-full rounded-[8px] bg-background border-control-border text-[13px]"
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
                    htmlFor="step-notes"
                    className="text-[12px] font-medium text-muted-foreground"
                  >
                    Notas internas
                  </Label>
                  <Textarea
                    id="step-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional: turno o alcance..."
                    className="min-h-[36px] h-9 rounded-[8px] bg-background border-control-border text-[12.5px]"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-foreground">
                      Permisos habilitados
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-[6px] px-1.5 py-0 text-[11px] tabular-nums"
                    >
                      {validPermissionsCount} / {ALL_PERMISSIONS.length}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPermissions(ALL_PERMISSIONS.map((p) => p.key))
                      }
                      className="h-7 px-2 text-[11.5px] font-medium text-link gap-1 rounded-[6px] cursor-pointer"
                    >
                      <CheckCheck className="size-3.5" />
                      <span>Todos</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPermissions(SUB_ROLE_LABELS[subRole].defaultPermissions)
                      }
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
                          onCheckedChange={() => togglePermission(perm.key)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Icon
                              className={cn(
                                "size-3.5 shrink-0",
                                isChecked
                                  ? "text-link"
                                  : "text-muted-foreground"
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
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="border-b border-border pb-3">
                <h2 className="text-[15px] font-semibold text-foreground">
                  Confirmación y alta
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Revisa los datos antes de crear la cuenta administrativa.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-muted/40 border border-border flex items-center gap-3">
                <Avatar className="size-10 rounded-[10px] shrink-0 after:hidden">
                  <AvatarFallback className="rounded-[10px] bg-sidebar-accent text-link font-semibold text-[13px]">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-foreground truncate">
                      {name}
                    </span>
                    <Badge
                      variant={subRole === "super_admin" ? "secondary" : "outline"}
                      className="rounded-[6px] px-2 py-0 text-[11px] font-medium"
                    >
                      {SUB_ROLE_LABELS[subRole].label}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {email} · {getDepartmentLabel(department)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                <div className="p-3 rounded-[10px] border border-border bg-background space-y-1">
                  <span className="text-[11px] text-muted-foreground">
                    Contacto
                  </span>
                  <p className="font-medium text-foreground">
                    {whatsappNumber || "Sin teléfono"}
                  </p>
                </div>
                <div className="p-3 rounded-[10px] border border-border bg-background space-y-1">
                  <span className="text-[11px] text-muted-foreground">
                    Permisos concedidos
                  </span>
                  <p className="font-medium text-foreground tabular-nums">
                    {validPermissionsCount} de {ALL_PERMISSIONS.length} reglas
                  </p>
                </div>
              </div>

              {notes.trim() && (
                <div className="p-3 rounded-[10px] border border-border bg-background space-y-1 text-[12.5px]">
                  <span className="text-[11px] text-muted-foreground">Notas</span>
                  <p className="text-foreground">{notes}</p>
                </div>
              )}
            </>
          )}

          {/* Barra de navegación del paso */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                render={<Link href="/dashboard/admin/staff" />}
                className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
              >
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Anterior</span>
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
              >
                <span>Siguiente</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="h-8 px-4 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 gap-1.5 cursor-pointer"
              >
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                <span>Crear cuenta staff</span>
              </Button>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
