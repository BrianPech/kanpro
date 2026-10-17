"use client";

import * as React from "react";
import {
  UserPlus,
  Mail,
  Eye,
  EyeOff,
  Send,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
}: RegisterEmployeeModalProps) {
  const [activeTab, setActiveTab] = React.useState<string>("invite");

  // Tab 1: Invitar Empleado
  const [inviteEmails, setInviteEmails] = React.useState("");

  // Tab 2: Registrar Empleado
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [forcePasswordChange, setForcePasswordChange] = React.useState(true);

  // Password visibility toggles
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
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
                Invita a nuevos colaboradores por correo electrónico o créalos directamente con sus credenciales de acceso.
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
          <TabsContent value="register" className="mt-4 space-y-4">
            <div className="space-y-3.5">
              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-xs font-semibold">
                  Nombre Completo
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Ej. Ana Sofía Morales"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ana.morales@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/60 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Contraseñas en Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Contraseña */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="rounded-xl font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5 cursor-pointer px-5"
              >
                <UserPlus className="size-3.5" />
                <span>Crear</span>
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
