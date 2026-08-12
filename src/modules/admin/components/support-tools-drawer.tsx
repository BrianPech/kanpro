"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  searchUserForSupport,
  sendDirectUserNotification,
  adjustCompanyCredits,
  quickResetUserStatus,
} from "@/app/(dashboard)/dashboard/admin/support/actions";
import {
  WrenchIcon,
  SearchIcon,
  BellIcon,
  CoinsIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  MailIcon,
  PhoneIcon,
  Building2Icon,
  UserIcon,
} from "lucide-react";

export interface SupportUserResult {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "company" | "admin";
  phone?: string;
  isVerified: boolean;
  avatar?: string;
  companyName?: string;
  creditsAvailable?: number;
  subscriptionPlan?: string;
  createdAt?: string;
}

interface SupportToolsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportToolsDrawer({ open, onOpenChange }: SupportToolsDrawerProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<SupportUserResult[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<SupportUserResult | null>(null);

  // Quick Action States
  const [notifTitle, setNotifTitle] = React.useState("");
  const [notifDesc, setNotifDesc] = React.useState("");
  const [sendingNotif, setSendingNotif] = React.useState(false);

  const [creditsDelta, setCreditsDelta] = React.useState(5);
  const [updatingCredits, setUpdatingCredits] = React.useState(false);

  const [togglingVerify, setTogglingVerify] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = (await searchUserForSupport(searchQuery)) as SupportUserResult[];
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedUser(results[0]);
      } else {
        setSelectedUser(null);
        toast.info("No se encontraron usuarios con ese criterio.");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al buscar usuarios.");
    } finally {
      setSearching(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !notifTitle || !notifDesc) return;

    setSendingNotif(true);
    try {
      await sendDirectUserNotification(selectedUser.id, notifTitle, notifDesc);
      toast.success(`Notificación enviada a ${selectedUser.name}`);
      setNotifTitle("");
      setNotifDesc("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al enviar notificación.");
    } finally {
      setSendingNotif(false);
    }
  };

  const handleAdjustCredits = async (amount: number) => {
    if (!selectedUser || selectedUser.role !== "company") return;

    setUpdatingCredits(true);
    try {
      const res = await adjustCompanyCredits(selectedUser.id, amount);
      toast.success(`Créditos actualizados. Nuevo saldo: ${res.newCredits} créditos.`);
      setSelectedUser((prev) =>
        prev ? { ...prev, creditsAvailable: res.newCredits } : null
      );
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al ajustar créditos.");
    } finally {
      setUpdatingCredits(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!selectedUser) return;

    setTogglingVerify(true);
    const targetState = !selectedUser.isVerified;
    try {
      await quickResetUserStatus(selectedUser.id, targetState);
      toast.success(
        targetState
          ? `Cuenta de ${selectedUser.name} verificada y habilitada`
          : `Verificación revocada para ${selectedUser.name}`
      );
      setSelectedUser((prev) => (prev ? { ...prev, isVerified: targetState } : null));
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar verificación.");
    } finally {
      setTogglingVerify(false);
    }
  };

  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-2xl md:rounded-l-2xl p-6 max-w-xl ml-auto h-full overflow-y-auto">
        <DrawerHeader className="gap-1.5 px-0 pt-0">
          <DrawerTitle className="flex items-center gap-2 text-primary font-bold text-lg">
            <WrenchIcon className="size-5 text-purple-500" />
            <span>Caja de Herramientas de Asistencia a Usuarios</span>
          </DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">
            Inspeccione cuentas, envíe notificaciones directas, ajuste créditos de empresas o valide expedientes.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 py-2">
          {/* Step 1: User Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col gap-2">
            <Label htmlFor="support-user-search" className="text-xs font-semibold">
              1. Buscar Usuario (Candidato o Empresa)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="support-user-search"
                  placeholder="Ingrese correo, nombre o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={searching} className="h-9 px-3 text-xs font-semibold">
                {searching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </form>

          {/* Search Result Selector if multiple */}
          {searchResults.length > 1 && (
            <div className="flex flex-col gap-1.5 border rounded-lg p-2 bg-muted/20">
              <span className="text-[11px] font-semibold text-muted-foreground">Coincidencias encontradas ({searchResults.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {searchResults.map((u) => (
                  <Button
                    key={u.id}
                    variant={selectedUser?.id === u.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs font-medium"
                    onClick={() => setSelectedUser(u)}
                  >
                    {u.name} ({u.role === "company" ? "Empresa" : "Candidato"})
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* User Card Details */}
          {selectedUser ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border/40 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {selectedUser.name?.substring(0, 2)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground">{selectedUser.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MailIcon className="size-3" /> {selectedUser.email}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 text-xs font-semibold ${
                    selectedUser.role === "company"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {selectedUser.role === "company" ? <Building2Icon className="size-3 mr-1" /> : <UserIcon className="size-3 mr-1" />}
                  {selectedUser.role === "company" ? "Empresa" : "Candidato"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/30">
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Teléfono / WhatsApp</span>
                  <span className="font-medium flex items-center gap-1">
                    <PhoneIcon className="size-3 text-muted-foreground" />
                    {selectedUser.phone || "No registrado"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-muted-foreground">Estado Verificación</span>
                  <span className="font-medium flex items-center gap-1">
                    {selectedUser.isVerified ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <UserCheckIcon className="size-3" /> Verificado
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Pendiente</span>
                    )}
                  </span>
                </div>

                {selectedUser.role === "company" && (
                  <div className="col-span-2 flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg mt-1">
                    <div className="flex items-center gap-2">
                      <CoinsIcon className="size-4 text-amber-600" />
                      <span className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                        Créditos Disponibles para Vacantes:
                      </span>
                    </div>
                    <span className="font-bold text-sm tabular-nums text-amber-700 dark:text-amber-400">
                      {selectedUser.creditsAvailable ?? 0} Créditos
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-1" />

              {/* Action 1: Direct Notification */}
              <form onSubmit={handleSendNotification} className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <BellIcon className="size-4 text-purple-500" />
                  <span className="text-xs font-bold text-foreground">Enviar Notificación Directa a la App</span>
                </div>
                <Input
                  placeholder="Título del mensaje (Ej. Asistencia de Cuenta)"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
                <Textarea
                  placeholder="Mensaje descriptivo para el usuario..."
                  value={notifDesc}
                  onChange={(e) => setNotifDesc(e.target.value)}
                  className="text-xs min-h-[50px]"
                  required
                />
                <Button type="submit" size="sm" disabled={sendingNotif} className="h-8 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white w-fit">
                  {sendingNotif ? "Enviando..." : "Enviar Notificación"}
                </Button>
              </form>

              {/* Action 2: Company Credits Adjustment */}
              {selectedUser.role === "company" && (
                <div className="flex flex-col gap-2.5 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="size-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">Acreditar Créditos de Publicación</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={creditsDelta}
                      onChange={(e) => setCreditsDelta(Number(e.target.value))}
                      className="h-8 text-xs w-24 tabular-nums"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAdjustCredits(creditsDelta)}
                      disabled={updatingCredits}
                      className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {updatingCredits ? "Ajustando..." : `Sumar +${creditsDelta} Créditos`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action 3: Verification Quick Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-blue-500" />
                  <span className="text-xs font-bold text-foreground">Estado de Verificación</span>
                </div>
                <Button
                  size="sm"
                  variant={selectedUser.isVerified ? "outline" : "default"}
                  onClick={handleToggleVerification}
                  disabled={togglingVerify}
                  className="h-8 text-xs font-semibold"
                >
                  {togglingVerify
                    ? "Actualizando..."
                    : selectedUser.isVerified
                    ? "Revocar Verificación"
                    : "Validar y Habilitar Cuenta"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center gap-2">
              <SearchIcon className="size-8 text-muted-foreground/50" />
              <p className="text-xs font-medium text-muted-foreground">
                Busque un usuario para inspeccionar su cuenta y aplicar acciones directas de soporte.
              </p>
            </div>
          )}
        </div>

        <DrawerFooter className="px-0 pt-4">
          <DrawerClose asChild>
            <Button variant="outline" className="h-9 font-semibold text-xs w-full">
              Cerrar Herramientas
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
