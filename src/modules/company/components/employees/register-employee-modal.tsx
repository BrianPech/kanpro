"use client";

import * as React from "react";
import {
  Mail,
  Eye,
  EyeOff,
  Send,
  Loader2,
  AlertCircle,
} from "@/components/ui/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
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
import {
  formatMexicoDateShort,
  getMexicoDateISO,
  calculateDailySalary,
  formatPaymentFrequencyLabel,
} from "@/lib/formatters";
import { registerDirectEmployeeAction } from "../../actions/employees";
import {
  getCompanyDepartmentsAction,
  createDepartmentAction,
} from "../../actions/areas";

interface RegisterEmployeeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
  onEmployeeCreated?: (employee: {
    id: string;
    employee_id?: string | null;
    full_name: string;
    phone?: string | null;
    avatar_url?: string | null;
    department?: string | null;
    job_title?: string | null;
    base_salary_monthly?: number | null;
    payment_frequency?: string | null;
    hire_date?: string | null;
    notes?: string | null;
  }) => void;
}

interface RegisteredSummary {
  fullName: string;
  email: string;
  jobTitle: string;
  baseSalary: number;
  paymentFrequency: string;
  department: string;
  hireDate: string;
  forcePasswordChange: boolean;
}

export function RegisterEmployeeModal({
  isOpen,
  onOpenChange,
  companyName,
  onEmployeeCreated,
}: RegisterEmployeeModalProps) {
  const [activeTab, setActiveTab] = React.useState<"register" | "invite">("register");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Tab 1: Registrar empleado
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [baseSalary, setBaseSalary] = React.useState("");
  const [paymentFrequency, setPaymentFrequency] = React.useState<
    "quincenal" | "semanal" | "mensual"
  >("quincenal");
  const [department, setDepartment] = React.useState("");
  const [showNewAreaInput, setShowNewAreaInput] = React.useState(false);
  const [newAreaName, setNewAreaName] = React.useState("");
  const [isCreatingArea, setIsCreatingArea] = React.useState(false);
  const [hireDate, setHireDate] = React.useState(() => getMexicoDateISO());
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [forcePasswordChange, setForcePasswordChange] = React.useState(true);

  // Tab 2: Invitar por correo
  const [inviteEmails, setInviteEmails] = React.useState("");

  // Confirmation step
  const [registeredSummary, setRegisteredSummary] =
    React.useState<RegisteredSummary | null>(null);

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

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setJobTitle("");
    setBaseSalary("");
    setPaymentFrequency("quincenal");
    setDepartment("");
    setShowNewAreaInput(false);
    setNewAreaName("");
    setHireDate(getMexicoDateISO());
    setPassword("");
    setConfirmPassword("");
    setForcePasswordChange(true);
    setInviteEmails("");
    setRegisteredSummary(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    if (isSubmitting || isCreatingArea) return;
    resetForm();
    onOpenChange(false);
  };

  const numericSalary = Number(baseSalary);
  const isRegisterFormValid =
    fullName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    jobTitle.trim().length >= 2 &&
    Number.isFinite(numericSalary) &&
    numericSalary > 0 &&
    password.length >= 8 &&
    confirmPassword === password;

  const handleCreateInlineArea = async () => {
    const cleanName = newAreaName.trim();
    if (cleanName.length < 2) {
      toast.error("Nombre de área inválido", {
        description: "Ingresa al menos 2 caracteres para crear el área.",
      });
      return;
    }

    setIsCreatingArea(true);
    try {
      const res = await createDepartmentAction({
        name: cleanName,
        description: "",
        color: "#6366f1",
        manager_name: "",
      });

      if (!res.success || !res.data) {
        toast.error("No se pudo crear el área", {
          description: res.error || "Intenta nuevamente.",
        });
        return;
      }

      setAvailableDepartments((prev) => [...prev, res.data!]);
      setDepartment(res.data.name);
      setNewAreaName("");
      setShowNewAreaInput(false);
      toast.success(`Área "${res.data.name}" creada y seleccionada`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el área.";
      toast.error("Error al crear área", { description: msg });
    } finally {
      setIsCreatingArea(false);
    }
  };

  const isInviteFormValid = inviteEmails.trim().length > 0;

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

    if (!jobTitle.trim() || jobTitle.trim().length < 2) {
      toast.error("Puesto requerido", {
        description: "Ingresa el puesto de trabajo (al menos 2 caracteres).",
      });
      return;
    }

    if (!Number.isFinite(numericSalary) || numericSalary <= 0) {
      toast.error("Sueldo inválido", {
        description: "Ingresa un sueldo bruto mayor a $0 MXN.",
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
      const cleanDept = department && department !== "none" ? department.trim() : "";
      const cleanJobTitle = jobTitle.trim();
      const cleanHireDate = hireDate || getMexicoDateISO();
      const res = await registerDirectEmployeeAction({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        force_password_change: forcePasswordChange,
        job_title: cleanJobTitle,
        base_salary_monthly: numericSalary,
        payment_frequency: paymentFrequency,
        department: cleanDept || undefined,
        hire_date: cleanHireDate,
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

      if (onEmployeeCreated && res.data?.employee) {
        onEmployeeCreated(res.data.employee);
      }

      setRegisteredSummary({
        fullName: fullName.trim(),
        email: email.trim(),
        jobTitle: cleanJobTitle,
        baseSalary: numericSalary,
        paymentFrequency,
        department: cleanDept,
        hireDate: res.data?.employee?.hire_date || cleanHireDate,
        forcePasswordChange,
      });
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

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInviteFormValid) return;

    const emails = inviteEmails
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    toast.info("Invitaciones preparadas", {
      description: `Se procesarán ${emails.length} ${emails.length === 1 ? "invitación" : "invitaciones"} por correo.`,
    });
    handleClose();
  };

  const orgSuffix = companyName ? ` en ${companyName}` : "";
  const orgJoinSuffix = companyName ? ` a ${companyName}` : "";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            "max-h-[90vh] overflow-y-auto rounded-[16px] border border-border bg-card p-[24px] shadow-[0px_12px_38px_0px_rgba(0,0,0,0.28)] gap-[18px] ring-0",
            registeredSummary ? "sm:max-w-[480px]" : "sm:max-w-[560px]"
          )}
        >
          {registeredSummary ? (
            <div className="flex flex-col gap-[18px] w-full">
              <div className="flex flex-col gap-[8px] items-start">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={32}
                  strokeWidth={1.8}
                  className="text-link"
                />
                <DialogTitle className="text-[25px] font-semibold leading-[31px] text-foreground">
                  Empleado registrado
                </DialogTitle>
                <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                  {registeredSummary.fullName} ya forma parte de{" "}
                  {companyName || "tu empresa"}.
                </DialogDescription>
              </div>

              <div className="bg-muted rounded-[10px] p-[12px] flex flex-col gap-[5px] w-full">
                <p className="text-[14px] font-medium leading-[20px] text-foreground">
                  {registeredSummary.jobTitle} · {registeredSummary.department || "Sin área asignada"}
                </p>
                <p className="text-[13px] font-normal leading-[19px] text-muted-foreground">
                  Sueldo · ${registeredSummary.baseSalary.toLocaleString("es-MX")} MXN ({formatPaymentFrequencyLabel(registeredSummary.paymentFrequency)})
                </p>
                <p className="text-[13px] font-normal leading-[19px] text-muted-foreground">
                  Fecha de ingreso · {formatMexicoDateShort(registeredSummary.hireDate)}
                </p>
                <p className="text-[13px] font-normal leading-[19px] text-muted-foreground">
                  Correo de acceso · {registeredSummary.email}
                </p>
                {registeredSummary.forcePasswordChange && (
                  <p className="text-[13px] font-normal leading-[19px] text-muted-foreground">
                    {registeredSummary.fullName.split(" ")[0]} deberá cambiar la
                    contraseña al iniciar sesión.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end w-full">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-[44px] px-[20px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold leading-[20px] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Volver a Plantilla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[18px] w-full">
              {/* Encabezado */}
              <div className="flex flex-col gap-[4px]">
                <DialogTitle className="text-[24px] font-semibold leading-[30px] text-foreground">
                  Agregar a tu equipo
                </DialogTitle>
                <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                  {activeTab === "register"
                    ? `Crea el acceso del empleado y asígnale un área${orgSuffix}.`
                    : `Invita a personas a unirse${orgJoinSuffix} con su cuenta de Kanpro.`}
                </DialogDescription>
              </div>

              {/* Tabs */}
              <div className="bg-muted p-[4px] rounded-[10px] grid grid-cols-2 gap-[8px] w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={cn(
                    "h-[40px] rounded-[7px] text-[14px] leading-[20px] flex items-center justify-center transition-colors cursor-pointer",
                    activeTab === "register"
                      ? "bg-sidebar-accent text-link font-semibold"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Registrar empleado
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("invite")}
                  className={cn(
                    "h-[40px] rounded-[7px] text-[14px] leading-[20px] flex items-center justify-center transition-colors cursor-pointer",
                    activeTab === "invite"
                      ? "bg-sidebar-accent text-link font-semibold"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )}
                >
                  Invitar por correo
                </button>
              </div>

              {/* Tab 1: Registrar empleado */}
              {activeTab === "register" ? (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-[18px]">
                  <div className="flex flex-col gap-[14px]">
                    {/* Nombre completo */}
                    <div className="flex flex-col gap-[6px]">
                      <label
                        htmlFor="full_name"
                        className="text-[14px] font-medium leading-[20px] text-foreground"
                      >
                        Nombre completo
                      </label>
                      <input
                        id="full_name"
                        type="text"
                        placeholder="Ej. Andrea Canul"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isSubmitting}
                        className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </div>

                    {/* Correo electrónico */}
                    <div className="flex flex-col gap-[6px]">
                      <label
                        htmlFor="email"
                        className="text-[14px] font-medium leading-[20px] text-foreground"
                      >
                        Correo electrónico
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="nombre@empresa.mx"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </div>

                    {/* Puesto y Sueldo */}
                    <div className="flex flex-col gap-[6px]">
                      <label
                        htmlFor="employee_job_title"
                        className="text-[14px] font-medium leading-[20px] text-foreground"
                      >
                        Puesto de trabajo
                      </label>
                      <input
                        id="employee_job_title"
                        type="text"
                        placeholder="Ej. Mesero, Recepcionista, Auxiliar..."
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        disabled={isSubmitting}
                        className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                      <div className="flex flex-col gap-[6px]">
                        <label
                          htmlFor="employee_salary"
                          className="text-[14px] font-medium leading-[20px] text-foreground"
                        >
                          Sueldo bruto ({formatPaymentFrequencyLabel(paymentFrequency)})
                        </label>
                        <input
                          id="employee_salary"
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Ej. 10500"
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(e.target.value)}
                          disabled={isSubmitting}
                          className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        />
                        {numericSalary > 0 && (
                          <p className="text-[11px] font-medium text-muted-foreground">
                            Salario diario: ${calculateDailySalary(numericSalary, paymentFrequency).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-[6px]">
                        <label
                          htmlFor="employee_frequency"
                          className="text-[14px] font-medium leading-[20px] text-foreground"
                        >
                          Periodicidad de pago
                        </label>
                        <Select
                          value={paymentFrequency}
                          onValueChange={(val) =>
                            val &&
                            setPaymentFrequency(
                              val as "quincenal" | "semanal" | "mensual"
                            )
                          }
                          disabled={isSubmitting}
                        >
                          <SelectTrigger
                            id="employee_frequency"
                            className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] font-normal text-foreground cursor-pointer"
                          >
                            <SelectValue>
                              {formatPaymentFrequencyLabel(paymentFrequency)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            alignItemWithTrigger={false}
                            side="bottom"
                            sideOffset={6}
                            className="w-(--anchor-width) rounded-[12px] p-1.5 border border-border shadow-xl bg-card"
                          >
                            <SelectItem value="quincenal" className="py-2 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer">
                              Quincenal (÷ 15 días)
                            </SelectItem>
                            <SelectItem value="semanal" className="py-2 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer">
                              Semanal (÷ 7 días)
                            </SelectItem>
                            <SelectItem value="mensual" className="py-2 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer">
                              Mensual (÷ 30 días)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Área de trabajo */}
                    <div className="flex flex-col gap-[6px]">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="employee_dept"
                          className="text-[14px] font-medium leading-[20px] text-foreground"
                        >
                          Área de trabajo
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewAreaInput((prev) => !prev)}
                          className="text-[12px] font-semibold text-link hover:underline cursor-pointer"
                        >
                          {showNewAreaInput ? "Cancelar nueva área" : "+ Crear nueva área"}
                        </button>
                      </div>
                      <Select
                        value={department}
                        onValueChange={(val) => setDepartment(val ?? "")}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger
                          id="employee_dept"
                          className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] font-normal text-foreground cursor-pointer"
                        >
                          <SelectValue
                            placeholder={
                              availableDepartments.length === 0
                                ? "Sin áreas creadas (puedes crear una arriba)"
                                : "Selecciona un área"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          side="bottom"
                          sideOffset={6}
                          className="w-(--anchor-width) min-w-[280px] rounded-[12px] p-1.5 border border-border shadow-xl bg-card max-h-64"
                        >
                          <SelectItem
                            value="none"
                            className="py-2 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer"
                          >
                            <span className="text-muted-foreground">Sin área asignada</span>
                          </SelectItem>
                          {availableDepartments.map((d) => (
                            <SelectItem
                              key={d.id}
                              value={d.name}
                              className="py-2 px-3 rounded-[8px] text-[13px] font-medium cursor-pointer"
                            >
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(availableDepartments.length === 0 || showNewAreaInput) && (
                        <div className="rounded-[10px] border border-dashed border-border bg-muted/40 p-2.5 flex flex-col gap-2">
                          {availableDepartments.length === 0 && (
                            <p className="text-[12px] text-muted-foreground">
                              Aún no tienes áreas de trabajo registradas. Crea una aquí para asignarla al empleado:
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newAreaName}
                              onChange={(e) => setNewAreaName(e.target.value)}
                              placeholder="Nombre del área (ej. Operaciones, Cocina)"
                              disabled={isCreatingArea || isSubmitting}
                              className="h-[38px] flex-1 rounded-[8px] border border-input bg-card px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                              type="button"
                              onClick={handleCreateInlineArea}
                              disabled={isCreatingArea || newAreaName.trim().length < 2}
                              className="h-[38px] px-3 rounded-[8px] bg-primary text-primary-foreground text-[12px] font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              {isCreatingArea ? "Creando..." : "Crear área"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fecha de ingreso (antigüedad LFT) */}
                    <div className="flex flex-col gap-[6px]">
                      <label
                        htmlFor="hire_date"
                        className="text-[14px] font-medium leading-[20px] text-foreground"
                      >
                        Fecha de ingreso
                      </label>
                      <input
                        id="hire_date"
                        type="date"
                        max={getMexicoDateISO()}
                        value={hireDate}
                        onChange={(e) => setHireDate(e.target.value)}
                        disabled={isSubmitting}
                        className="h-[44px] w-full rounded-[8px] border border-input bg-card px-[12px] text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      />
                      <p className="text-[12px] font-normal leading-[18px] text-muted-foreground">
                        Por defecto es la fecha actual; ajústala si el colaborador ya tenía antigüedad previa (LFT).
                      </p>
                    </div>

                    {/* Contraseña de acceso */}
                    <div className="flex flex-col gap-[6px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                        <div className="flex flex-col gap-[6px]">
                          <label
                            htmlFor="password"
                            className="text-[14px] font-medium leading-[20px] text-foreground"
                          >
                            Contraseña inicial
                          </label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Crea una contraseña"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={isSubmitting}
                              className="h-[44px] w-full rounded-[8px] border border-input bg-card pl-[12px] pr-[36px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={
                                showPassword ? "Ocultar contraseña" : "Ver contraseña"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-[6px]">
                          <label
                            htmlFor="confirm_password"
                            className="text-[14px] font-medium leading-[20px] text-foreground"
                          >
                            Confirmar contraseña
                          </label>
                          <div className="relative">
                            <input
                              id="confirm_password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Repite la contraseña"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              disabled={isSubmitting}
                              className="h-[44px] w-full rounded-[8px] border border-input bg-card pl-[12px] pr-[36px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                              aria-label={
                                showConfirmPassword
                                  ? "Ocultar confirmación"
                                  : "Ver confirmación"
                              }
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
                      <p className="text-[12px] font-normal leading-[18px] text-muted-foreground">
                        Mínimo 8 caracteres.
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-center gap-[10px]">
                      <Checkbox
                        id="force_password_change"
                        checked={forcePasswordChange}
                        onCheckedChange={(checked) =>
                          setForcePasswordChange(Boolean(checked))
                        }
                        disabled={isSubmitting}
                        className="size-[18px] rounded-[4px]"
                      />
                      <label
                        htmlFor="force_password_change"
                        className="text-[13px] font-medium leading-[19px] text-foreground cursor-pointer select-none"
                      >
                        Exigir cambio de contraseña en el primer inicio de sesión
                      </label>
                    </div>
                  </div>

                  <div className="h-px bg-border w-full" />

                  <div className="flex items-center justify-end gap-[8px]">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="h-[44px] px-[18px] rounded-[8px] bg-card border border-control-border text-[14px] font-semibold leading-[20px] text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isRegisterFormValid}
                      className={cn(
                        "h-[44px] px-[18px] rounded-[8px] text-[14px] font-semibold leading-[20px] inline-flex items-center justify-center gap-2 transition-colors",
                        isRegisterFormValid && !isSubmitting
                          ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Registrando...</span>
                        </>
                      ) : (
                        <span>Registrar empleado</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Tab 2: Invitar por correo */
                <form onSubmit={handleInviteSubmit} className="flex flex-col gap-[18px]">
                  <div className="flex flex-col gap-[8px]">
                    <label
                      htmlFor="invite_emails"
                      className="text-[14px] font-medium leading-[20px] text-foreground"
                    >
                      Correos electrónicos
                    </label>
                    <textarea
                      id="invite_emails"
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="Ej. nombre@empresa.mx"
                      className="min-h-[104px] w-full rounded-[8px] border border-input bg-card p-[12px] text-[14px] text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-[13px] font-normal leading-[19px] text-muted-foreground">
                      Escribe uno o varios correos, separados por comas o saltos de línea.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-[8px]">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="h-[44px] px-[18px] rounded-[8px] bg-card border border-control-border text-[14px] font-semibold leading-[20px] text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!isInviteFormValid}
                      className={cn(
                        "h-[44px] px-[18px] rounded-[8px] text-[14px] font-semibold leading-[20px] inline-flex items-center justify-center transition-colors",
                        isInviteFormValid
                          ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      Enviar invitaciones
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para Notificación de Conflicto o Error */}
      <AlertDialog
        open={alertState.isOpen}
        onOpenChange={(open) =>
          setAlertState((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent className="z-[70] rounded-[16px] max-w-md p-6 border-border shadow-2xl bg-card text-card-foreground">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 rounded-[10px] flex items-center justify-center shrink-0",
                  alertState.type === "user_exists"
                    ? "bg-sidebar-accent text-link"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {alertState.type === "user_exists" ? (
                  <Mail className="size-5" />
                ) : (
                  <AlertCircle className="size-5" />
                )}
              </div>
              <AlertDialogTitle className="text-[18px] font-semibold text-foreground">
                {alertState.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[14px] text-muted-foreground pt-2 leading-relaxed">
              {alertState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 pt-3">
            {alertState.type === "user_exists" ? (
              <>
                <AlertDialogCancel className="h-[40px] rounded-[8px] text-[13px] font-semibold cursor-pointer">
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
                  className="h-[40px] rounded-[8px] text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="size-3.5" />
                  <span>Ir a Invitar Empleado</span>
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogCancel className="h-[40px] rounded-[8px] text-[13px] font-semibold cursor-pointer">
                Entendido
              </AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
