"use client";

import * as React from "react";
import {
  UserPlus,
  Mail,
  Eye,
  EyeOff,
  Send,
  Loader2,
  AlertCircle,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { registerDirectEmployeeAction } from "../../actions/employees";
import { getCompanyDepartmentsAction } from "../../actions/areas";

interface RegisterEmployeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeCreated?: (employee: {
    id: string;
    employee_id?: string | null;
    full_name: string;
    phone?: string | null;
    avatar_url?: string | null;
    department?: string | null;
    job_title?: string | null;
    hire_date?: string | null;
    notes?: string | null;
  }) => void;
}

export function RegisterEmployeeModal({
  isOpen,
  onOpenChange,
  onEmployeeCreated,
}: RegisterEmployeeModalProps) {
  const [activeTab, setActiveTab] = React.useState<string>("register");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Tab 1: Invitar Empleado
  const [inviteEmails, setInviteEmails] = React.useState("");

  // Tab 2: Registrar Empleado
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [forcePasswordChange, setForcePasswordChange] = React.useState(true);

  // Departments list from company
  const [availableDepartments, setAvailableDepartments] = React.useState<
    { id: string; name: string; color?: string | null }[]
  >([]);

  React.useEffect(() => {
    if (isOpen) {
      getCompanyDepartmentsAction().then((res) => {
        if (res.success && res.data) {
          setAvailableDepartments(res.data);
        }
      });
    }
  }, [isOpen]);

  // Password visibility toggles
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Alert Dialog State (para avisos y opción A de usuario ya registrado)
  const [alertState, setAlertState] = React.useState<{
    isOpen: boolean;
    type: "user_exists" | "error";
    title: string;
    description: string;
    conflictEmail?: string;
  }>({
    isOpen: false,
    type: "user_exists",
    title: "",
    description: "",
  });

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("Nombre requerido", {
        description: "El nombre completo debe tener al menos 3 caracteres.",
      });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Correo inválido", {
        description: "Ingresa un correo electrónico válido.",
      });
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Contraseña insegura", {
        description: "La contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Contraseñas no coinciden", {
        description: "Asegúrate de que la confirmación sea exactamente igual a la contraseña.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerDirectEmployeeAction({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        force_password_change: forcePasswordChange,
        department: department && department !== "none" ? department.trim() : undefined,
      });

      if (!res.success) {
        const errorText = res.error || "No se pudo completar el registro.";
        const isUserAlreadyRegistered =
          errorText.toLowerCase().includes("ya está registrado") ||
          errorText.toLowerCase().includes("invitar empleado") ||
          errorText.toLowerCase().includes("already registered");

        if (isUserAlreadyRegistered) {
          setAlertState({
            isOpen: true,
            type: "user_exists",
            title: "Empleado ya registrado en K'anPro",
            description: errorText,
            conflictEmail: email.trim(),
          });
        } else {
          setAlertState({
            isOpen: true,
            type: "error",
            title: "Aviso de Registro",
            description: errorText,
          });
        }
        return;
      }

      toast.success("¡Empleado registrado exitosamente!", {
        description: `${fullName.trim()} se ha incorporado a tu plantilla de empleados.`,
      });

      if (onEmployeeCreated && res.data?.employee) {
        onEmployeeCreated(res.data.employee);
      }

      // Reset form
      setFullName("");
      setEmail("");
      setDepartment("");
      setPassword("");
      setConfirmPassword("");
      setForcePasswordChange(true);

      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al registrar.";
      setAlertState({
        isOpen: true,
        type: "error",
        title: "Error inesperado",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Alta de Empleados
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Invita a nuevos empleados por correo electrónico o créalos directamente con sus credenciales de acceso.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="grid grid-cols-2 w-full h-11 p-1 rounded-2xl bg-muted/60 border border-border/40">
            <TabsTrigger
              value="invite"
              className="rounded-xl text-xs font-bold gap-2 cursor-pointer transition-all data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
            >
              <Mail className="size-4" />
              <span>Invitar Empleado</span>
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-xl text-xs font-bold gap-2 cursor-pointer transition-all data-active:bg-background data-active:text-foreground data-active:shadow-2xs"
            >
              <UserPlus className="size-4" />
              <span>Registrar Empleado</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INVITAR EMPLEADO */}
          <TabsContent value="invite" className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="invite_emails" className="text-xs font-bold text-foreground">
                Correos electrónicos de los empleados a invitar
              </Label>
              <Textarea
                id="invite_emails"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder={"ejemplo1@empresa.com, ejemplo2@empresa.com\no escribe una lista de correos separados por coma o salto de línea..."}
                className="min-h-[160px] rounded-2xl p-3.5 bg-background border-border/60 text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary resize-y"
              />
              <p className="text-[11px] text-muted-foreground">
                Escribe uno o varios correos electrónicos separados por comas o saltos de línea para enviar las invitaciones de registro.
              </p>
            </div>

            <DialogFooter className="pt-3 border-t border-border/40 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5 cursor-pointer px-5"
              >
                <Send className="size-3.5" />
                <span>Invitar</span>
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* TAB 2: REGISTRAR EMPLEADO */}
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-3.5">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Ej. Ana Sofía Morales"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Correo Electrónico <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ana.morales@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Área o Departamento */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employee_dept" className="text-xs font-semibold">
                      Área o Departamento <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </Label>
                    <a
                      href="/dashboard/company/areas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      + Gestionar áreas
                    </a>
                  </div>
                  <Select
                    value={department}
                    onValueChange={(val) => setDepartment(val ?? "")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="employee_dept"
                      className="w-full text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <SelectValue placeholder="Selecciona el área para este colaborador..." />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      side="bottom"
                      sideOffset={6}
                      className="w-(--anchor-width) min-w-[320px] sm:min-w-[420px] rounded-2xl p-2 border border-border/70 shadow-2xl bg-popover/98 backdrop-blur-md max-h-72"
                    >
                      <SelectItem
                        value="none"
                        className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer my-0.5 focus:bg-accent transition-colors"
                      >
                        <span className="text-muted-foreground italic">Sin área asignada</span>
                      </SelectItem>
                      {availableDepartments.map((d) => (
                        <SelectItem
                          key={d.id}
                          value={d.name}
                          className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5 focus:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="size-3 rounded-full shrink-0 shadow-2xs ring-1 ring-border/20"
                              style={{ backgroundColor: d.color || "#6366f1" }}
                            />
                            <span className="text-foreground">{d.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contraseñas en Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Contraseña */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Contraseña <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pr-9 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-semibold">
                      Confirmar Contraseña <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pr-9 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={showConfirmPassword ? "Ocultar confirmación" : "Ver confirmación"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkbox: Forzar modificación de contraseña */}
                <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/20 p-3.5 mt-2">
                  <Checkbox
                    id="force_password_change"
                    checked={forcePasswordChange}
                    onCheckedChange={(checked) => setForcePasswordChange(Boolean(checked))}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="force_password_change"
                      className="text-xs font-bold text-foreground cursor-pointer"
                    >
                      Forzar modificación de contraseña
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Indicarle al usuario creado que debe cambiar su contraseña obligatoriamente en su primer inicio de sesión.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border/40 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5 cursor-pointer px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      <span>Crear</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Alert Dialog para Notificación de Conflicto (Opción A) o Error */}
    <AlertDialog
      open={alertState.isOpen}
      onOpenChange={(open) => setAlertState((prev) => ({ ...prev, isOpen: open }))}
    >
      <AlertDialogContent className="z-[70] rounded-3xl max-w-md p-6 border-border/60 shadow-2xl bg-card text-card-foreground">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center shrink-0",
                alertState.type === "user_exists"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {alertState.type === "user_exists" ? (
                <Mail className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
            </div>
            <AlertDialogTitle className="text-base font-extrabold text-foreground">
              {alertState.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
            {alertState.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 pt-3">
          {alertState.type === "user_exists" ? (
            <>
              <AlertDialogCancel className="h-10 rounded-xl text-xs font-semibold cursor-pointer">
                Permanecer aquí
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const emailToInvite = alertState.conflictEmail || email.trim();
                  if (emailToInvite) {
                    setInviteEmails((prev) =>
                      prev.trim() ? `${prev.trim()}\n${emailToInvite}` : emailToInvite
                    );
                  }
                  setActiveTab("invite");
                  setAlertState((prev) => ({ ...prev, isOpen: false }));
                }}
                className="h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="size-3.5" />
                <span>Ir a Invitar Empleado</span>
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogCancel className="h-10 rounded-xl text-xs font-semibold cursor-pointer">
              Entendido
            </AlertDialogCancel>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
