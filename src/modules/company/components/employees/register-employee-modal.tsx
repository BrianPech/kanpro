"use client";

import * as React from "react";
import {
  UserPlus,
  Briefcase,
  Phone,
  Loader2,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createEmployeeInvitationAction,
  bulkImportEmployeesAction,
} from "../../actions/employees";
import {
  CONTRACT_TYPES,
  type CreateEmployeeInvitationValues,
  type BulkImportPreviewItem,
} from "../../schemas/employee-invitation.schema";
import {
  downloadEmployeeCsvTemplate,
  parseEmployeeCsvText,
} from "../../utils/employee-csv-parser";

const DEPARTMENTS = [
  "Operaciones",
  "Alimentos y Bebidas",
  "Cocina & Producción",
  "Mantenimiento",
  "Recepción & Front Desk",
  "Ama de Llaves & Limpieza",
  "Ventas & Comercial",
  "Administración & Finanzas",
  "Recursos Humanos",
  "Seguridad & Vigilancia",
  "Logística & Almacén",
  "Otro Departamento",
];

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
  const [activeTab, setActiveTab] = React.useState<string>("manual");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = React.useState<CreateEmployeeInvitationValues>({
    full_name: "",
    email: "",
    position: "",
    department: "Operaciones",
    salary: undefined,
    hire_date: new Date().toISOString().split("T")[0],
    contract_type: "tiempo_indeterminado",
    phone: "",
    employee_code: "",
    work_schedule: "Lunes a Viernes 08:00 - 17:00",
    notes: "",
  });

  // Success Invitation State (for single manual register)
  const [createdInviteData, setCreatedInviteData] = React.useState<{
    fullName: string;
    email: string;
    rawToken: string;
  } | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Bulk Import State
  const [isDragging, setIsDragging] = React.useState(false);
  const [parsedRows, setParsedRows] = React.useState<BulkImportPreviewItem[]>([]);
  const [importFileName, setImportFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleManualChange = (
    field: keyof CreateEmployeeInvitationValues,
    value: CreateEmployeeInvitationValues[keyof CreateEmployeeInvitationValues]
  ) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualForm.full_name || manualForm.full_name.trim().length < 3) {
      toast.error("Nombre requerido", {
        description: "Ingresa el nombre completo del colaborador (mínimo 3 caracteres).",
      });
      return;
    }

    if (!manualForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualForm.email.trim())) {
      toast.error("Correo electrónico requerido", {
        description: "Ingresa un correo válido para que el colaborador reciba su invitación.",
      });
      return;
    }

    if (!manualForm.position || manualForm.position.trim().length < 2) {
      toast.error("Puesto de trabajo requerido", {
        description: "Especifica el puesto que ocupará el colaborador.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createEmployeeInvitationAction({
        ...manualForm,
        salary:
          manualForm.salary && !isNaN(Number(manualForm.salary))
            ? Number(manualForm.salary)
            : undefined,
      });

      if (res.success) {
        toast.success("¡Invitación generada exitosamente!", {
          description: `Se ha creado el expediente preliminar y la invitación para ${manualForm.full_name}.`,
        });

        if (onEmployeeCreated) {
          onEmployeeCreated(res.employee);
        }

        setCreatedInviteData({
          fullName: manualForm.full_name,
          email: manualForm.email,
          rawToken: res.rawToken,
        });

        // Reset form
        setManualForm({
          full_name: "",
          email: "",
          position: "",
          department: "Operaciones",
          salary: undefined,
          hire_date: new Date().toISOString().split("T")[0],
          contract_type: "tiempo_indeterminado",
          phone: "",
          employee_code: "",
          work_schedule: "Lunes a Viernes 08:00 - 17:00",
          notes: "",
        });
      }
    } catch (err: unknown) {
      console.error("Error creating employee invitation:", err);
      const message = err instanceof Error ? err.message : "No se pudo registrar la invitación.";
      toast.error("Error al registrar colaborador", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInviteData) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${createdInviteData.rawToken}`;

    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    toast.success("Enlace copiado al portapapeles", {
      description: "Puedes compartirlo directamente por WhatsApp o correo electrónico.",
    });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!createdInviteData) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${createdInviteData.rawToken}`;
    const text = encodeURIComponent(
      `¡Hola ${createdInviteData.fullName}! Te invitamos a completar tu alta como colaborador en K'anPro ingresando al siguiente enlace: ${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // CSV file reading
  const handleFileSelected = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Formato no soportado", {
        description: "Por favor sube un archivo con formato .csv.",
      });
      return;
    }

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const rows = parseEmployeeCsvText(text);
        setParsedRows(rows);
        if (rows.length === 0) {
          toast.warning("Archivo vacío o formato no reconocido", {
            description: "Descarga la plantilla oficial para guiarte en las columnas.",
          });
        } else {
          const validCount = rows.filter((r) => r.isValid).length;
          toast.info(`${rows.length} colaboradores detectados`, {
            description: `${validCount} listos para importar. Revisa la previsualización.`,
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleBulkSubmit = async () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      toast.error("Sin filas válidas", {
        description: "Corrige los errores señalados en la tabla antes de proceder.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bulkImportEmployeesAction(
        validItems.map((item) => ({
          full_name: item.full_name,
          email: item.email,
          position: item.position,
          salary: item.salary,
          hire_date: item.hire_date,
          contract_type: item.contract_type,
          department: item.department,
          phone: item.phone,
        }))
      );

      toast.success("¡Importación completada!", {
        description: `Se han importado ${res.imported} colaboradores y enviado sus invitaciones.`,
      });

      if (onEmployeeCreated) {
        onEmployeeCreated({
          id: "",
          full_name: "",
        });
      }

      setParsedRows([]);
      setImportFileName(null);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Error bulk importing employees:", err);
      const message = err instanceof Error ? err.message : "Ocurrió un problema al procesar los registros.";
      toast.error("Error en la importación masiva", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCreatedInviteData(null);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        {createdInviteData ? (
          /* Success Screen: Link Ready */
          <div className="space-y-6 py-4 text-center">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                ¡Invitación Generada Exitosamente!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                Se ha pre-registrado a <span className="font-semibold text-foreground">{createdInviteData.fullName}</span> ({createdInviteData.email}) en tu plantilla de colaboradores con estatus <span className="font-semibold text-amber-600 dark:text-amber-400">Pendiente</span>.
              </DialogDescription>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 text-left space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Enlace único de registro para el colaborador:
              </span>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${createdInviteData.rawToken}`}
                  className="rounded-xl h-10 text-xs font-mono bg-background"
                />
                <Button
                  onClick={handleCopyLink}
                  className="rounded-xl h-10 px-4 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  variant={isCopied ? "default" : "outline"}
                >
                  {isCopied ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleShareWhatsApp}
                className="w-full sm:w-auto rounded-xl font-bold text-xs h-10 flex items-center gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                <Share2 className="size-4" />
                <span>Compartir por WhatsApp</span>
              </Button>

              <Button
                onClick={() => setCreatedInviteData(null)}
                variant="outline"
                className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 cursor-pointer"
              >
                + Invitar a otro colaborador
              </Button>

              <Button
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Finalizar y Ver Plantilla
              </Button>
            </div>
          </div>
        ) : (
          /* Normal Flow: Tabs for Manual vs CSV Import */
          <>
            <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Alta de Colaboradores
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Invita a un nuevo miembro individualmente o importa tu plantilla completa vía CSV.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
              <TabsList className="grid grid-cols-2 w-full rounded-2xl p-1 bg-muted/60">
                <TabsTrigger
                  value="manual"
                  className="rounded-xl py-2 text-xs font-bold flex items-center gap-2"
                >
                  <UserPlus className="size-4" />
                  <span>1. Registrar Manualmente</span>
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="rounded-xl py-2 text-xs font-bold flex items-center gap-2"
                >
                  <FileSpreadsheet className="size-4" />
                  <span>2. Importar (Excel / CSV)</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: REGISTRO MANUAL */}
              <TabsContent value="manual" className="mt-4">
                <form onSubmit={handleManualSubmit} className="space-y-5">
                  {/* Bloque 1: Datos Personales */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      <span>Datos del Colaborador e Invitación</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="full_name" className="text-xs font-semibold">
                          Nombre Completo <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="full_name"
                          placeholder="Ej. Juan Pérez"
                          value={manualForm.full_name}
                          onChange={(e) => handleManualChange("full_name", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold">
                          Correo Electrónico <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="juan.perez@empresa.com"
                          value={manualForm.email}
                          onChange={(e) => handleManualChange("email", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                          required
                        />
                        <p className="text-[10px] text-muted-foreground">
                          A este correo se vinculará la cuenta y se enviará la invitación.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold">
                          Teléfono Móvil (WhatsApp)
                        </Label>
                        <Input
                          id="phone"
                          placeholder="Ej. 999 123 4567"
                          value={manualForm.phone || ""}
                          onChange={(e) => handleManualChange("phone", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Cargo y Contrato */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="size-3.5" />
                      <span>Condiciones Laborales y Puesto</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="position" className="text-xs font-semibold">
                          Puesto / Cargo <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="position"
                          placeholder="Ej. Supervisor de Operaciones"
                          value={manualForm.position}
                          onChange={(e) => handleManualChange("position", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="employee_code" className="text-xs font-semibold">
                          No. Empleado (Opcional)
                        </Label>
                        <Input
                          id="employee_code"
                          placeholder="EMP-001"
                          value={manualForm.employee_code || ""}
                          onChange={(e) => handleManualChange("employee_code", e.target.value)}
                          className="rounded-xl h-10 text-sm font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="department" className="text-xs font-semibold">
                          Departamento
                        </Label>
                        <Select
                          value={manualForm.department}
                          onValueChange={(val) => handleManualChange("department", val)}
                        >
                          <SelectTrigger id="department" className="rounded-xl h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-56">
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept} className="text-xs">
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contract_type" className="text-xs font-semibold">
                          Tipo de Contrato
                        </Label>
                        <Select
                          value={manualForm.contract_type}
                          onValueChange={(val) => handleManualChange("contract_type", val)}
                        >
                          <SelectTrigger id="contract_type" className="rounded-xl h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {CONTRACT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="text-xs">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="hire_date" className="text-xs font-semibold">
                          Fecha de Ingreso
                        </Label>
                        <Input
                          id="hire_date"
                          type="date"
                          value={manualForm.hire_date || ""}
                          onChange={(e) => handleManualChange("hire_date", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-1 space-y-1.5">
                        <Label htmlFor="salary" className="text-xs font-semibold">
                          Salario Mensual (MXN)
                        </Label>
                        <Input
                          id="salary"
                          type="number"
                          step="100"
                          placeholder="Ej. 16000"
                          value={manualForm.salary ?? ""}
                          onChange={(e) =>
                            handleManualChange(
                              "salary",
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="work_schedule" className="text-xs font-semibold">
                          Horario Habitual
                        </Label>
                        <Input
                          id="work_schedule"
                          placeholder="Ej. Lunes a Viernes 08:00 - 17:00"
                          value={manualForm.work_schedule || ""}
                          onChange={(e) => handleManualChange("work_schedule", e.target.value)}
                          className="rounded-xl h-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-3 border-t border-border/40 gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                      className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Generando Invitación...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          <span>Guardar e Invitar Colaborador</span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              {/* TAB 2: IMPORTAR CSV / EXCEL */}
              <TabsContent value="import" className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Download className="size-3.5 text-primary" />
                      Plantilla oficial para importación
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Usa nuestro formato con columnas: nombre_completo, email, puesto, salario_mensual, fecha_ingreso...
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadEmployeeCsvTemplate}
                    className="rounded-xl text-xs font-semibold h-8.5 px-3 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="size-3.5" />
                    <span>Descargar Plantilla CSV</span>
                  </Button>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                    isDragging
                      ? "border-primary bg-primary/5 scale-[0.99]"
                      : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <UploadCloud className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      {importFileName ? (
                        <span className="text-primary font-mono">{importFileName}</span>
                      ) : (
                        "Arrastra aquí tu archivo CSV o haz clic para seleccionarlo"
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Soporta archivos separados por comas o punto y coma (.csv)
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                {parsedRows.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          Previsualización ({parsedRows.length} colaboradores)
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        >
                          {parsedRows.filter((r) => r.isValid).length} válidos
                        </Badge>
                        {parsedRows.some((r) => !r.isValid) && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] font-bold"
                          >
                            {parsedRows.filter((r) => !r.isValid).length} con errores
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setParsedRows([]);
                          setImportFileName(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground h-7"
                      >
                        Limpiar
                      </Button>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-2xl border border-border/50 text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border/40 text-muted-foreground text-[10px] font-bold uppercase text-left">
                            <th className="p-2.5">Fila</th>
                            <th className="p-2.5">Colaborador</th>
                            <th className="p-2.5">Puesto & Depto</th>
                            <th className="p-2.5">Salario</th>
                            <th className="p-2.5 text-right">Estatus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {parsedRows.map((row) => (
                            <tr
                              key={row.rowIndex}
                              className={
                                row.isValid
                                  ? "hover:bg-muted/20"
                                  : "bg-rose-500/5 hover:bg-rose-500/10"
                              }
                            >
                              <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                                #{row.rowIndex}
                              </td>
                              <td className="p-2.5">
                                <div className="font-semibold text-foreground">
                                  {row.full_name || "<Sin nombre>"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {row.email || "<Sin correo>"}
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="text-foreground">{row.position || "-"}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {row.department}
                                </div>
                              </td>
                              <td className="p-2.5 font-mono">
                                {row.salary ? `$${row.salary.toLocaleString("es-MX")}` : "-"}
                              </td>
                              <td className="p-2.5 text-right">
                                {row.isValid ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold">
                                    Válido
                                  </Badge>
                                ) : (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <Badge variant="destructive" className="text-[10px] font-bold">
                                      Error
                                    </Badge>
                                    <span className="text-[9px] text-rose-500 max-w-[150px] truncate">
                                      {row.errors[0]}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <DialogFooter className="pt-3 border-t border-border/40 gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={
                      isSubmitting ||
                      parsedRows.length === 0 ||
                      parsedRows.filter((r) => r.isValid).length === 0
                    }
                    className="rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Procesando Importación...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-4" />
                        <span>
                          Importar {parsedRows.filter((r) => r.isValid).length} Colaboradores
                        </span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
