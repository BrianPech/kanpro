"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  Sparkles,
  RotateCw,
  LogOut,
  Coffee,
  LogIn,
  Check,
  Building2,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  GeofenceConfig,
  CheckInMethod,
  MobileCheckInPayload,
  AttendanceRecord,
  EmployeeSelectOption,
} from "../../types/attendance";
import { calculateDistanceInMeters } from "../../utils/attendance-utils";
import { recordAttendanceCheckInAction } from "../../actions/attendance";

interface MobileCheckInSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  branchConfig: GeofenceConfig;
  onRecordCreated: (record: AttendanceRecord) => void;
  employees?: EmployeeSelectOption[];
}

export function MobileCheckInSheet({
  isOpen,
  onOpenChange,
  branchConfig,
  onRecordCreated,
  employees = [],
}: MobileCheckInSheetProps) {
  const [activeTab, setActiveTab] = useState<CheckInMethod>("gps");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(28); // Default simulated inside
  const [isWithinGeofence, setIsWithinGeofence] = useState(true);

  // QR state
  const [qrToken, setQrToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Ticking digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request GPS
  const handleRequestGPS = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setGpsCoords({ lat, lng, accuracy: acc });

          const dist = calculateDistanceInMeters(
            lat,
            lng,
            branchConfig.latitude,
            branchConfig.longitude
          );
          setDistanceMeters(dist);
          setIsWithinGeofence(dist <= branchConfig.radiusMeters);
          setIsLocating(false);
        },
        (_err) => {
          // Fallback location near branch
          const fallbackLat = branchConfig.latitude + 0.0001;
          const fallbackLng = branchConfig.longitude + 0.0001;
          setGpsCoords({ lat: fallbackLat, lng: fallbackLng, accuracy: 8 });
          const dist = calculateDistanceInMeters(
            fallbackLat,
            fallbackLng,
            branchConfig.latitude,
            branchConfig.longitude
          );
          setDistanceMeters(dist);
          setIsWithinGeofence(dist <= branchConfig.radiusMeters);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "gps") {
      handleRequestGPS();
    }
  }, [isOpen, activeTab]);

  const handleSimulateQRScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setQrToken(
        `KANPRO-${branchConfig.branchName.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`
      );
      toast.success("Código QR escaneado con éxito", {
        description: `Validado para: ${branchConfig.branchName}.`,
      });
    }, 1200);
  };

  const handleExecuteAction = async (actionType: MobileCheckInPayload["actionType"]) => {
    if (!selectedEmployeeId) {
      toast.error("Por favor selecciona un colaborador de la plantilla.");
      return;
    }

    if (activeTab === "gps" && !isWithinGeofence) {
      toast.error("Fuera de la zona de trabajo autorizada", {
        description: `Estás a ${distanceMeters}m de la sucursal. El límite máximo es de ${branchConfig.radiusMeters}m.`,
      });
      return;
    }

    if (activeTab === "qr" && !qrToken.trim()) {
      toast.error("Escanea o ingresa el código QR del establecimiento.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await recordAttendanceCheckInAction({
        employeeId: selectedEmployeeId,
        actionType,
        method: activeTab,
        coordinates: gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng, accuracy: gpsCoords.accuracy } : undefined,
        distanceMeters,
        qrToken: activeTab === "qr" ? qrToken : undefined,
      });

      if (!res.success || !res.record) {
        toast.error("Error al registrar checada", {
          description: res.error || "No se pudo conectar con el servidor.",
        });
        return;
      }

      const raw = res.record;
      const newRecord: AttendanceRecord = {
        id: raw.id,
        employeeId: raw.employee_id,
        employeeName: activeEmployee?.name || "Colaborador",
        avatarUrl: activeEmployee?.avatarUrl || null,
        jobTitle: activeEmployee?.jobTitle || "Colaborador",
        department: activeEmployee?.department || "Operaciones",
        workDate: raw.work_date,
        scheduledCheckIn: raw.scheduled_check_in,
        scheduledCheckOut: raw.scheduled_check_out,
        checkInTime: raw.check_in_time,
        checkOutTime: raw.check_out_time,
        breakStartTime: raw.break_start_time,
        breakEndTime: raw.break_end_time,
        checkInMethod: raw.check_in_method as CheckInMethod,
        delayMinutes: raw.delay_minutes || 0,
        status: raw.status as any,
        overtimeHours: Number(raw.overtime_hours) || 0,
      };

      onRecordCreated(newRecord);

      let actionLabel = "Entrada registrada";
      if (actionType === "check_out") actionLabel = "Salida registrada";
      if (actionType === "break_start") actionLabel = "Inicio de receso registrado";
      if (actionType === "break_end") actionLabel = "Fin de receso registrado";

      toast.success(actionLabel, {
        description: res.isLate
          ? `Registro exitoso a las ${res.timeStr} con ${res.delayMinutes} min de retardo.`
          : `Registro puntual exitoso a las ${res.timeStr} (${activeTab.toUpperCase()}).`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error executing check-in:", err);
      toast.error("Error al procesar la checada", {
        description: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Smartphone className="size-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
            Checador Móvil K&apos;anPro
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {branchConfig.branchName} • Tolerancia: 15 min.
          </DialogDescription>
        </DialogHeader>

        {/* Live Digital Clock */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 border border-primary/20 text-center space-y-1 shadow-xs">
          <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-wider font-mono">
            {currentTime || "--:--:--"}
          </div>
          <p className="text-xs text-muted-foreground font-bold capitalize">
            {currentDateFormatted}
          </p>
        </div>

        {/* Employee selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">
            Colaborador Activo *
          </Label>
          {employees.length > 0 ? (
            <Select
              value={selectedEmployeeId}
              onValueChange={(val) => {
                if (val) setSelectedEmployeeId(val);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                <SelectValue placeholder="Selecciona un colaborador..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-56">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium">
                    {emp.name} — {emp.jobTitle} ({emp.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground text-center">
              No hay colaboradores registrados en la plantilla.
            </div>
          )}
        </div>

        {/* Verification Method Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as CheckInMethod)}
          className="w-full space-y-4 pt-1"
        >
          <TabsList className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl h-11 border border-border/40">
            <TabsTrigger
              value="gps"
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <MapPin className="size-3.5" />
              <span>Geolocalización GPS</span>
            </TabsTrigger>
            <TabsTrigger
              value="qr"
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
            >
              <QrCode className="size-3.5" />
              <span>Código QR Sucursal</span>
            </TabsTrigger>
          </TabsList>

          {/* GPS Tab */}
          <TabsContent value="gps" className="space-y-3 mt-0 focus-visible:outline-none">
            <div
              className={cn(
                "p-4 rounded-2xl border transition-all space-y-2.5 text-center",
                isWithinGeofence
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                  : "bg-rose-500/5 border-rose-500/30 text-rose-900 dark:text-rose-300"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {isWithinGeofence ? (
                  <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="size-4" />
                  </div>
                ) : (
                  <div className="size-8 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="size-4" />
                  </div>
                )}
                <span className="text-xs font-extrabold">
                  {isWithinGeofence
                    ? "Ubicación Validada (Dentro del Geofence)"
                    : "Fuera del Perímetro de Trabajo"}
                </span>
              </div>

              <div className="flex justify-center items-center gap-4 text-xs font-semibold">
                <div>
                  <span className="text-muted-foreground font-normal">Distancia:</span>{" "}
                  <span className="font-mono font-bold">{distanceMeters}m</span>
                </div>
                <div className="size-1 rounded-full bg-border" />
                <div>
                  <span className="text-muted-foreground font-normal">Radio permitido:</span>{" "}
                  <span className="font-mono font-bold">{branchConfig.radiusMeters}m</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestGPS}
                disabled={isLocating}
                className="h-8 rounded-lg text-xs font-bold gap-1.5 mx-auto bg-background/80"
              >
                <RotateCw className={cn("size-3", isLocating && "animate-spin")} />
                <span>{isLocating ? "Obteniendo GPS..." : "Actualizar Coordenadas"}</span>
              </Button>
            </div>
          </TabsContent>

          {/* QR Tab */}
          <TabsContent value="qr" className="space-y-3 mt-0 focus-visible:outline-none">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <QrCode className="size-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-foreground">
                  Escanea el Código QR del Kiosco de Sucursal
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ubicado físicamente en la entrada o recepción del centro de trabajo.
                </p>
              </div>

              {qrToken ? (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                  <Check className="size-3.5" />
                  <span>Token: {qrToken}</span>
                </div>
              ) : (
                <Button
                  onClick={handleSimulateQRScan}
                  disabled={isScanning}
                  className="w-full h-9 rounded-xl text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Sparkles className="size-3.5" />
                  <span>{isScanning ? "Escaneando cámara..." : "Escanear QR de Sucursal"}</span>
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Button
            onClick={() => handleExecuteAction("check_in")}
            disabled={isSubmitting || !selectedEmployeeId}
            className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
          >
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wide">
              <LogIn className="size-4" />
              <span>ENTRADA</span>
            </div>
            <span className="text-[10px] opacity-80 font-medium">Inicio de Turno</span>
          </Button>

          <Button
            onClick={() => handleExecuteAction("check_out")}
            disabled={isSubmitting || !selectedEmployeeId}
            variant="outline"
            className="h-14 rounded-2xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wide">
              <LogOut className="size-4" />
              <span>SALIDA</span>
            </div>
            <span className="text-[10px] opacity-80 font-medium">Cierre de Jornada</span>
          </Button>

          <Button
            onClick={() => handleExecuteAction("break_start")}
            disabled={isSubmitting || !selectedEmployeeId}
            variant="ghost"
            className="h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/50 gap-1.5"
          >
            <Coffee className="size-3.5 text-amber-500" />
            <span>Inicio Receso</span>
          </Button>

          <Button
            onClick={() => handleExecuteAction("break_end")}
            disabled={isSubmitting || !selectedEmployeeId}
            variant="ghost"
            className="h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/50 gap-1.5"
          >
            <Clock className="size-3.5 text-blue-500" />
            <span>Fin Receso</span>
          </Button>
        </div>

        {/* Shift info note */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            <span className="font-semibold">Horario Asignado:</span>
          </div>
          <span className="font-mono font-bold text-foreground">
            {activeEmployee?.workSchedule || "08:00 - 17:00"}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
