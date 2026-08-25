"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Coffee,
  LogOut,
  LogIn,
  Smartphone,
  Navigation,
  Sparkles,
  ShieldCheck,
  Building2,
  RefreshCw,
  Camera,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GeofenceConfig,
  CheckInMethod,
  MobileCheckInPayload,
  AttendanceRecord,
} from "../../types/attendance";
import { calculateDistanceInMeters } from "../../utils/attendance-utils";

interface MobileCheckInSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  branchConfig: GeofenceConfig;
  onRecordCreated: (record: AttendanceRecord) => void;
}

export function MobileCheckInSheet({
  isOpen,
  onOpenChange,
  branchConfig,
  onRecordCreated,
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

  // Employee state
  const [employeeName, setEmployeeName] = useState("Carlos Mendoza");
  const [selectedShift, setSelectedShift] = useState("08:00 - 17:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          // Fallback simulation inside branch
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
      setQrToken(`KANPRO-${branchConfig.branchName.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`);
      toast.success("Código QR escaneado con éxito", {
        description: `Validado para: ${branchConfig.branchName}.`,
      });
    }, 1200);
  };

  const handleExecuteAction = (actionType: MobileCheckInPayload["actionType"]) => {
    if (!employeeName.trim()) {
      toast.error("Por favor ingresa tu nombre de colaborador.");
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

    setTimeout(() => {
      setIsSubmitting(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      // Scheduled 08:00 with 15m tolerance
      const isLate = currentHour > 8 || (currentHour === 8 && currentMin > 15);
      const delay = isLate ? (currentHour - 8) * 60 + currentMin : 0;

      const newRecord: AttendanceRecord = {
        id: `att-mob-${Date.now()}`,
        employeeId: `emp-${Date.now()}`,
        employeeName: employeeName.trim(),
        avatarUrl: null,
        jobTitle: "Colaborador K'anPro",
        department: "Operaciones",
        workDate: now.toISOString().split("T")[0],
        scheduledCheckIn: "08:00",
        scheduledCheckOut: "17:00",
        checkInTime: actionType === "check_in" ? timeStr : "08:00",
        checkOutTime: actionType === "check_out" ? timeStr : null,
        breakStartTime: actionType === "break_start" ? timeStr : null,
        breakEndTime: actionType === "break_end" ? timeStr : null,
        checkInMethod: activeTab,
        checkInLocation:
          activeTab === "gps"
            ? {
                lat: gpsCoords?.lat || branchConfig.latitude,
                lng: gpsCoords?.lng || branchConfig.longitude,
                distanceToBranchMeters: distanceMeters,
              }
            : undefined,
        delayMinutes: isLate ? delay : 0,
        status: isLate ? "retardo" : "presente",
        overtimeHours: 0,
      };

      onRecordCreated(newRecord);

      let actionLabel = "Entrada registrada";
      if (actionType === "check_out") actionLabel = "Salida registrada";
      if (actionType === "break_start") actionLabel = "Inicio de receso registrado";
      if (actionType === "break_end") actionLabel = "Fin de receso registrado";

      toast.success(actionLabel, {
        description: isLate
          ? `Registro exitoso a las ${timeStr} con ${delay} min de retardo.`
          : `Registro puntual exitoso a las ${timeStr} (${activeTab.toUpperCase()}).`,
      });

      onOpenChange(false);
    }, 800);
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
          <Label htmlFor="emp-mobile-name" className="text-xs font-bold text-foreground">
            Nombre del Colaborador
          </Label>
          <Input
            id="emp-mobile-name"
            placeholder="Ej. Carlos Mendoza"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
          />
        </div>

        {/* Verification Method Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as CheckInMethod)}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 p-1 h-11 rounded-xl bg-muted/60">
            <TabsTrigger
              value="gps"
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <MapPin className="size-3.5" />
              <span>GPS / Geocerca</span>
            </TabsTrigger>
            <TabsTrigger
              value="qr"
              className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-1.5"
            >
              <QrCode className="size-3.5" />
              <span>Código QR Local</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB GPS */}
          <TabsContent value="gps" className="space-y-3 mt-0">
            <div className="p-4 rounded-xl border border-border/60 bg-background space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Radio className="size-4 text-primary animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    Radar de Ubicación
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRequestGPS}
                  disabled={isLocating}
                  className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn("size-3 mr-1", isLocating && "animate-spin")} />
                  {isLocating ? "Detectando..." : "Actualizar GPS"}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Distancia a sucursal:</span>
                <span className="font-extrabold text-foreground">
                  {distanceMeters} metros
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Radio autorizado:</span>
                <span className="font-bold text-foreground">
                  Hasta {branchConfig.radiusMeters}m
                </span>
              </div>

              <div className="pt-2">
                <Badge
                  className={cn(
                    "w-full justify-center py-1.5 rounded-lg text-xs font-bold border-none",
                    isWithinGeofence
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {isWithinGeofence ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Dentro de la zona autorizada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      Fuera de rango (Excede {branchConfig.radiusMeters}m)
                    </span>
                  )}
                </Badge>
              </div>
            </div>
          </TabsContent>

          {/* TAB QR */}
          <TabsContent value="qr" className="space-y-3 mt-0">
            <div className="p-4 rounded-xl border border-border/60 bg-background space-y-3 text-center">
              <div className="size-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center border border-dashed border-border/80">
                <Camera className="size-8 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-foreground">
                  Escáner de Kiosco QR
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Apunta tu cámara al código QR impreso en recepción.
                </p>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={handleSimulateQRScan}
                  disabled={isScanning}
                  className="rounded-xl text-xs font-bold h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
                >
                  <QrCode className="size-3.5" />
                  <span>{isScanning ? "Escaneando..." : "Escanear QR de Entrada"}</span>
                </Button>
              </div>

              {qrToken && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Token verificado: {qrToken}</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Tactical Buttons */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={() => handleExecuteAction("check_in")}
              disabled={isSubmitting || (activeTab === "gps" && !isWithinGeofence)}
              className="h-12 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2"
            >
              <LogIn className="size-4" />
              <span>REGISTRAR ENTRADA</span>
            </Button>

            <Button
              type="button"
              onClick={() => handleExecuteAction("check_out")}
              disabled={isSubmitting || (activeTab === "gps" && !isWithinGeofence)}
              className="h-12 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center justify-center gap-2"
            >
              <LogOut className="size-4" />
              <span>REGISTRAR SALIDA</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExecuteAction("break_start")}
              disabled={isSubmitting}
              className="h-10 rounded-xl text-xs font-bold border-border/70 flex items-center justify-center gap-1.5"
            >
              <Coffee className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span>Iniciar Receso</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleExecuteAction("break_end")}
              disabled={isSubmitting}
              className="h-10 rounded-xl text-xs font-bold border-border/70 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Fin de Receso</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
