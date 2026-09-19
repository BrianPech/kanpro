"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Users,
  Building2,
  Briefcase,
  BarChart3,
  Settings2,
  Lock,
  Mail,
  Phone,
  CheckCheck,
  RotateCcw,
  CheckCircle2,
  Shield,
  Check,
  FileText,
  User,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  type AdminPermissionKey,
} from "@/modules/admin/types/staff";
import { createAdminStaffMember } from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  if (!name) return "ST";
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

const STEPS = [
  { id: 1, label: "Datos Personales", desc: "Información y contacto" },
  { id: 2, label: "Credenciales", desc: "Contraseña de acceso" },
  { id: 3, label: "Rol & Permisos", desc: "Alcance y capacidades" },
  { id: 4, label: "Confirmación", desc: "Revisión final y alta" },
];

export function NewStaffFormClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);

  // Form States
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

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Por favor ingrese el nombre completo del administrador.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        toast.error("Ingrese una dirección de correo institucional válida.");
        return;
      }
      if (!department.trim()) {
        toast.error("Ingrese el departamento o área asignada.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!password || password.length < 6) {
        toast.error("La contraseña debe contener al menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden. Verifique ambas claves.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Por favor complete todos los campos obligatorios.");
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

      toast.success(`¡Personal ${name} registrado exitosamente con credenciales de acceso!`);
      router.push("/dashboard/admin/staff");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al registrar el personal.");
    } finally {
      setSubmitting(false);
    }
  };

  const validPermissionsCount = permissions.filter((p) =>
    ALL_PERMISSIONS.some((ap) => ap.key === p)
  ).length;

  const passwordMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="outline"
            size="icon"
            render={<Link href="/dashboard/admin/staff" />}
            className="size-10 rounded-2xl border-border/60 shrink-0 cursor-pointer shadow-none hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Administración de Personal
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-semibold text-primary">Asistente por Pasos</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground truncate">
              Dar de Alta a Nuevo Staff / Administrador
            </h1>
          </div>
        </div>

        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1 rounded-xl self-start sm:self-auto">
          Paso {currentStep} de 4
        </Badge>
      </div>

      {/* Modern Stepper Indicator */}
      <Card className="bg-card border border-border/60 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  // Only allow clicking to past steps or current step
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all flex items-center gap-3",
                  isCurrent
                    ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                    : isCompleted
                    ? "bg-muted/30 border-border/60 cursor-pointer hover:bg-muted/50"
                    : "bg-muted/10 border-transparent opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-colors",
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-4 stroke-[3]" /> : step.id}
                </div>

                <div className="min-w-0">
                  <h4 className={cn("text-xs font-extrabold truncate", isCurrent ? "text-primary" : "text-foreground")}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step Content Container */}
      <form onSubmit={handleSubmit}>
        
        {/* ================= PASO 1: DATOS PERSONALES ================= */}
        {currentStep === 1 && (
          <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-border/50 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  <span>Paso 1: Información Personal y Contacto</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ingrese los datos de identidad y el departamento institucional donde laborará.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">1/4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="step-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nombre Completo *
                </Label>
                <Input
                  id="step-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Ana María Gómez Pérez"
                  autoFocus
                  className="h-11 rounded-2xl bg-muted/30 border-border/60 text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="step-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Correo Institucional (Login) *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="step-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agomez@kanpro.com"
                    className="h-11 pl-10 rounded-2xl bg-muted/30 border-border/60 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="step-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Teléfono / WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="step-phone"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+52 999 123 4567"
                    className="h-11 pl-10 rounded-2xl bg-muted/30 border-border/60 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="step-department" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Departamento o Área Asignada *
                </Label>
                <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
                  <SelectTrigger id="step-department" className="h-11 w-full rounded-2xl bg-muted/30 border-border/60 text-sm font-medium px-3.5 gap-2.5">
                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Seleccionar departamento institucional..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width) min-w-[340px] rounded-2xl border-border/60 p-1.5 shadow-2xl bg-popover">
                    <SelectGroup>
                      {STAFF_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value} className="text-xs sm:text-sm rounded-xl py-2.5 px-3 cursor-pointer">
                          <span className="font-semibold">{dept.label}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                render={<Link href="/dashboard/admin/staff" />}
                className="h-11 px-5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleNextStep}
                className="h-11 px-6 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-xs"
              >
                <span>Continuar a Credenciales</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ================= PASO 2: CREDENCIALES DE ACCESO ================= */}
        {currentStep === 2 && (
          <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-border/50 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Lock className="size-5 text-purple-600" />
                  <span>Paso 2: Credenciales de Acceso y Seguridad</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Establezca la contraseña inicial para que el administrador pueda iniciar sesión.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">2/4</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="step-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contraseña Inicial *
                </Label>
                <div className="relative">
                  <Input
                    id="step-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                    className="h-11 pr-10 rounded-2xl bg-muted/30 border-border/60 text-sm font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="step-confirm-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Confirmar Contraseña *
                  </Label>
                  {passwordMatch && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" /> Las contraseñas coinciden
                    </span>
                  )}
                </div>
                <Input
                  id="step-confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita la clave inicial"
                  className={cn(
                    "h-11 rounded-2xl bg-muted/30 border-border/60 text-sm font-medium font-mono transition-colors",
                    confirmPassword && !passwordMatch && "border-rose-500/50 focus-visible:ring-rose-500/20"
                  )}
                />
              </div>

              {/* Security Hint */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-1 text-xs">
                <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <ShieldCheck className="size-4" />
                  Política de Seguridad K’anPro
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  El nuevo administrador podrá iniciar sesión con su correo (<strong>{email || "correo@kanpro.com"}</strong>) y esta contraseña. Podrá actualizarla posteriormente desde su panel de ajustes de seguridad.
                </p>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="h-11 px-5 rounded-2xl text-xs font-bold cursor-pointer gap-1.5"
              >
                <ArrowLeft className="size-4" />
                <span>Volver</span>
              </Button>

              <Button
                type="button"
                onClick={handleNextStep}
                className="h-11 px-6 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-xs"
              >
                <span>Continuar a Rol & Permisos</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ================= PASO 3: ROL Y PERMISOS ================= */}
        {currentStep === 3 && (
          <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-border/50 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <KeyRound className="size-5 text-primary" />
                  <span>Paso 3: Rol Administrativo y Permisos Granulares</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seleccione el rol principal y personalice las capacidades que tendrá en la plataforma.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">3/4</span>
            </div>

            {/* Role Selection Grid */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selecciona el Rol Administrativo *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(
                  [
                    { key: "ops_admin", label: "Admin Operaciones", desc: "Gestión de usuarios y vacantes" },
                    { key: "verification_admin", label: "Agente Verificación", desc: "Dictamen fiscal y expedientes" },
                    { key: "support", label: "Soporte Técnico", desc: "Atención a usuarios y tickets" },
                    { key: "content_admin", label: "Admin Contenido", desc: "Moderación y publicaciones" },
                    { key: "super_admin", label: "Super Admin", desc: "Acceso total y directivo" },
                  ] as const
                ).map((r) => {
                  const isSelected = subRole === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => handleSubRoleChange(r.key)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                          : "bg-muted/20 border-border/60 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-foreground">
                          {r.label}
                        </span>
                        {isSelected && <ShieldCheck className="size-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {r.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Permissions Matrix */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-purple-600" />
                  <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Permisos Granulares ({validPermissionsCount}/{ALL_PERMISSIONS.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 px-2.5 text-xs font-bold text-primary gap-1 hover:bg-primary/10 rounded-xl cursor-pointer"
                  >
                    <CheckCheck className="size-3.5" />
                    <span>Conceder Todos</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetRoleDefaults}
                    className="h-7 px-2.5 text-xs font-bold text-muted-foreground gap-1 hover:bg-muted rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer por Rol</span>
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
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
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

            {/* Notes */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <Label htmlFor="step-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notas u Observaciones Internas (Opcional)
              </Label>
              <Textarea
                id="step-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de alta, turnos o responsabilidades específicas..."
                className="min-h-[70px] rounded-2xl bg-muted/30 border-border/60 text-xs font-medium"
              />
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="h-11 px-5 rounded-2xl text-xs font-bold cursor-pointer gap-1.5"
              >
                <ArrowLeft className="size-4" />
                <span>Volver</span>
              </Button>

              <Button
                type="button"
                onClick={handleNextStep}
                className="h-11 px-6 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-xs"
              >
                <span>Revisar Resumen</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* ================= PASO 4: CONFIRMACIÓN Y RESUMEN ================= */}
        {currentStep === 4 && (
          <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-border/50 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="size-5 text-purple-600" />
                  <span>Paso 4: Resumen y Confirmación de Alta</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifique que toda la información y permisos sean correctos antes de crear la cuenta.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">4/4</span>
            </div>

            {/* Live Profile Showcase Card */}
            <div className="p-5 rounded-3xl bg-muted/30 border border-border/60 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14 rounded-2xl border border-border/60 bg-purple-500/10 text-purple-600 font-extrabold text-base shrink-0">
                  <AvatarFallback className="bg-purple-500/10 text-purple-600 font-extrabold">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-extrabold text-foreground truncate">
                      {name || "Nombre de Administrador"}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-xs px-2.5 py-0.5 font-bold rounded-lg border bg-purple-500/10 text-purple-600 border-purple-500/20"
                    >
                      {SUB_ROLE_LABELS[subRole]?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {email} • {department}
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border/40 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Teléfono</span>
                  <p className="font-semibold text-foreground">{whatsappNumber || "No especificado"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado Inicial</span>
                  <p className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Activo
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Permisos Asignados</span>
                  <p className="font-extrabold text-primary font-mono">{validPermissionsCount} de {ALL_PERMISSIONS.length}</p>
                </div>
              </div>
            </div>

            {/* Permissions Summary Badges */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Capacidades y Permisos que se le otorgarán:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_PERMISSIONS.filter((p) => permissions.includes(p.key)).map((p) => {
                  const Icon = getPermissionIcon(p.key);
                  return (
                    <div
                      key={p.key}
                      className="p-3 rounded-2xl bg-card border border-border/60 flex items-center gap-2.5 text-xs font-bold text-foreground"
                    >
                      <Icon className="size-4 text-primary shrink-0" />
                      <span className="truncate">{p.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {notes && (
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 text-xs space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Notas de Alta:</span>
                <p className="text-foreground italic">{notes}</p>
              </div>
            )}

            {/* Final Submission Navigation Bar */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={submitting}
                className="h-11 px-5 rounded-2xl text-xs font-bold cursor-pointer gap-1.5"
              >
                <ArrowLeft className="size-4" />
                <span>Volver al Paso 3</span>
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 px-8 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creando Cuenta de Staff...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    <span>Confirmar y Dar de Alta</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

      </form>
    </div>
  );
}
