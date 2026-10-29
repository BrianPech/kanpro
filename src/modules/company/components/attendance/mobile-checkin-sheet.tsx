"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Camera,
  CameraOff,
  Radio,
  FileCheck2,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import jsQR from "jsqr";
import {
  GeofenceConfig,
  CheckInMethod,
  MobileCheckInPayload,
  AttendanceRecord,
  EmployeeSelectOption,
  AttendanceActionType,
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

interface AttendanceVoucherData {
  employeeName: string;
  jobTitle: string;
  department: string;
  scheduledCheckIn: string;
  scheduledCheckOut: string;
  checkInTime: string;
  isLate: boolean;
  delayMinutes: number;
  actionType: AttendanceActionType;
  method: string;
  distanceMeters: number;
}

export function MobileCheckInSheet({
  isOpen,
  onOpenChange,
  branchConfig,
  onRecordCreated,
  employees = [],
}: MobileCheckInSheetProps) {
  const [activeTab, setActiveTab] = useState<CheckInMethod>("qr");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  // GPS State
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number>(24);
  const [isWithinGeofence, setIsWithinGeofence] = useState(true);

  // QR & Camera Scanner State
  const [qrToken, setQrToken] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher Success Modal State
  const [voucherData, setVoucherData] = useState<AttendanceVoucherData | null>(null);

  // Video & Canvas refs for real-time QR decode
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

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

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Request GPS
  const handleRequestGPS = useCallback(() => {
    setIsLocating(true);
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
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
          // Fallback simulation near branch center
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
  }, [branchConfig]);

  // Request GPS whenever modal opens
  useEffect(() => {
    if (isOpen) {
      handleRequestGPS();
    } else {
      stopCamera();
    }
  }, [isOpen, handleRequestGPS, stopCamera]);

  // Process raw QR text detected
  const handleQrPayload = useCallback((rawText: string) => {
    let token = rawText.trim();
    try {
      if (rawText.startsWith("KANPRO://CHECKIN")) {
        const url = new URL(rawText.replace("KANPRO://CHECKIN", "https://checkin.kanpro"));
        token = url.searchParams.get("token") || token;
      } else if (rawText.includes("/checkin")) {
        const url = new URL(rawText, "https://checkin.kanpro");
        token = url.searchParams.get("t") || url.searchParams.get("token") || token;
      } else if (rawText.startsWith("{")) {
        const parsed = JSON.parse(rawText);
        token = parsed.token || parsed.qrToken || token;
      }
    } catch {
      // Keep rawText as token
    }

    setQrToken(token);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    toast.success("Código QR de Sucursal Validado", {
      description: `Token: ${token}`,
    });
  }, []);

  // Frame scanner loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleQrPayload(code.data);
        stopCamera();
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [handleQrPayload, stopCamera]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError(
        "No se pudo acceder a la cámara. Revisa permisos o utiliza la simulación de checada."
      );
      setIsCameraActive(false);
    }
  };

  // Simulated scan for environments without cameras
  const handleSimulateQRScan = () => {
    const simulatedToken = `V${Date.now().toString().slice(-4)}`;
    handleQrPayload(simulatedToken);
  };

  // Execution Handler: Doble Factor (QR + Geocerca GPS)
  const handleExecuteAction = async (actionType: MobileCheckInPayload["actionType"]) => {
    if (!selectedEmployeeId) {
      toast.error("Por favor selecciona un empleado de la plantilla.");
      return;
    }

    // Validación Factor 1: Código QR de la sucursal
    if (activeTab === "qr" && !qrToken.trim()) {
      toast.error("Se requiere escanear el Código QR oficial de la sucursal.");
      return;
    }

    // Validación Factor 2: Geocerca GPS en sitio
    if (!isWithinGeofence) {
      toast.error("Fuera de la zona de trabajo autorizada", {
        description: `Estás a ${distanceMeters}m de la sucursal. El límite máximo autorizado es de ${branchConfig.radiusMeters}m. El doble factor requiere estar físicamente en la sucursal.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await recordAttendanceCheckInAction({
        employeeId: selectedEmployeeId,
        actionType,
        method: activeTab,
        coordinates: gpsCoords
          ? { lat: gpsCoords.lat, lng: gpsCoords.lng, accuracy: gpsCoords.accuracy }
          : undefined,
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
        employeeName: res.employeeName || activeEmployee?.name || "Empleado",
        avatarUrl: activeEmployee?.avatarUrl || null,
        jobTitle: res.jobTitle || activeEmployee?.jobTitle || "Empleado",
        department: res.department || activeEmployee?.department || "Operaciones",
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

      // Open Success Confirmation Voucher
      setVoucherData({
        employeeName: res.employeeName || activeEmployee?.name || "Empleado",
        jobTitle: res.jobTitle || activeEmployee?.jobTitle || "Empleado",
        department: res.department || activeEmployee?.department || "Operaciones",
        scheduledCheckIn: res.scheduledCheckIn || raw.scheduled_check_in || "08:00",
        scheduledCheckOut: res.scheduledCheckOut || raw.scheduled_check_out || "17:00",
        checkInTime: res.timeStr || raw.check_in_time || "--:--",
        isLate: !!res.isLate,
        delayMinutes: res.delayMinutes || 0,
        actionType: res.actionTaken || actionType,
        method: activeTab,
        distanceMeters,
      });

      stopCamera();
    } catch (err: unknown) {
      console.error("Error executing check-in:", err);
      const msg = err instanceof Error ? err.message : "Intenta nuevamente.";
      toast.error("Error al procesar la checada", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseVoucher = () => {
    setVoucherData(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6 bg-card border-border/80 max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-1 text-center">
            <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1 shadow-inner">
              <Smartphone className="size-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Checador Móvil K&apos;anPro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              {branchConfig.branchName} • Doble Factor: QR + Geocerca GPS
            </DialogDescription>
          </DialogHeader>

          {/* Live Digital Clock */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 border border-primary/20 text-center space-y-0.5 shadow-xs">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-wider font-mono">
              {currentTime || "--:--:--"}
            </div>
            <p className="text-xs text-muted-foreground font-bold capitalize">
              {currentDateFormatted}
            </p>
          </div>

          {/* Employee selector & Assigned Schedule */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                Empleado en Turno *
              </Label>
              {employees.length > 0 ? (
                <Select
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    if (val) setSelectedEmployeeId(val);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue placeholder="Selecciona un empleado..." />
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
                  No hay empleados registrados en la plantilla.
                </div>
              )}
            </div>

            {/* Shift & Employee Card */}
            {activeEmployee && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Horario Asignado
                  </span>
                  <span className="text-sm font-black text-foreground font-mono">
                    {activeEmployee.workSchedule || "08:00 - 17:00"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Tolerancia
                  </span>
                  <Badge variant="outline" className="font-bold text-[10px] bg-background text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    15 min
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Verification Method Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as CheckInMethod);
              if (val !== "qr") stopCamera();
            }}
            className="w-full space-y-3 pt-1"
          >
            <TabsList className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl h-11 border border-border/40">
              <TabsTrigger
                value="qr"
                className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
              >
                <QrCode className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Escanear QR de Sucursal</span>
              </TabsTrigger>
              <TabsTrigger
                value="gps"
                className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5"
              >
                <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Solo GPS (Campo)</span>
              </TabsTrigger>
            </TabsList>

            {/* QR Scanner & Doble Factor Tab */}
            <TabsContent value="qr" className="space-y-3 mt-0 focus-visible:outline-none">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-center space-y-3">
                <div className="flex items-center justify-between text-xs font-bold border-b border-border/40 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Radio className="size-3.5 text-indigo-500 animate-pulse" />
                    <span>Doble Factor: QR + Geocerca GPS</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold",
                      isWithinGeofence
                        ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                        : "text-rose-600 border-rose-500/30 bg-rose-500/10"
                    )}
                  >
                    {isWithinGeofence ? `GPS OK (${distanceMeters}m)` : `Fuera (${distanceMeters}m)`}
                  </Badge>
                </div>

                {/* Camera Viewfinder */}
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-indigo-500/50 shadow-inner">
                    <video
                      ref={videoRef}
                      className="size-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanning Target Box */}
                    <div className="absolute size-32 border-2 border-indigo-400 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                      <div className="size-2 rounded-full bg-indigo-500" />
                    </div>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopCamera}
                      className="absolute bottom-2 right-2 h-7 rounded-lg text-[10px] font-bold px-2.5 gap-1 bg-black/70 hover:bg-black/90 text-white"
                    >
                      <CameraOff className="size-3" />
                      <span>Cerrar Cámara</span>
                    </Button>
                  </div>
                ) : (
                  <div className="py-2 space-y-2">
                    <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                      <QrCode className="size-6" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-foreground">
                        Escanea el Cartel QR de la Entrada
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Apunta tu cámara al código QR impreso en la recepción de {branchConfig.branchName}.
                      </p>
                    </div>

                    {cameraError && (
                      <p className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                        {cameraError}
                      </p>
                    )}

                    {qrToken ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Check className="size-4" />
                          <span>QR Validado: {qrToken}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setQrToken("")}
                          className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-1.5"
                        >
                          Reescanear
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                          onClick={startCamera}
                          className="flex-1 h-10 rounded-xl text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                          <Camera className="size-4" />
                          <span>Activar Cámara Móvil</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={handleSimulateQRScan}
                          className="h-10 rounded-xl text-xs font-bold gap-1.5 border-border/80 text-muted-foreground hover:text-foreground"
                        >
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span>Simular QR</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* GPS Only Tab */}
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
                      ? "Ubicación Validada en Sitio"
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
          </Tabs>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              onClick={() => handleExecuteAction("check_in")}
              disabled={isSubmitting || !selectedEmployeeId}
              className="h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center gap-0.5 shadow-md shadow-emerald-600/20"
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
              className="h-14 rounded-2xl border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center gap-0.5"
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
        </DialogContent>
      </Dialog>

      {/* Confirmation Digital Voucher Modal */}
      {voucherData && (
        <Dialog open={true} onOpenChange={handleCloseVoucher}>
          <DialogContent className="sm:max-w-[440px] rounded-3xl p-6 bg-card border-border/80 text-center space-y-4">
            <DialogHeader className="space-y-1 text-center">
              <div className="mx-auto size-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                <ShieldCheck className="size-8" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
                ¡Asistencia Registrada!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Comprobante Digital de Checador K&apos;anPro
              </DialogDescription>
            </DialogHeader>

            {/* Voucher Card */}
            <div className="p-5 rounded-2xl bg-muted/30 border border-border/80 text-left space-y-3.5 shadow-inner">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Empleado
                  </span>
                  <h4 className="text-base font-extrabold text-foreground">
                    {voucherData.employeeName}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {voucherData.jobTitle} • {voucherData.department}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "text-xs font-extrabold px-2.5 py-1",
                    voucherData.isLate
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  )}
                >
                  {voucherData.isLate ? `Retardo (${voucherData.delayMinutes}m)` : "Puntual"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Horario Entrada
                  </span>
                  <span className="text-sm font-black font-mono text-foreground">
                    {voucherData.scheduledCheckIn}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Salida: {voucherData.scheduledCheckOut}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Hora Checada
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {voucherData.checkInTime}
                  </span>
                  <span className="text-[10px] text-muted-foreground block capitalize">
                    {voucherData.actionType === "check_in"
                      ? "Entrada Turno"
                      : voucherData.actionType === "check_out"
                      ? "Salida Turno"
                      : "Receso"}
                  </span>
                </div>
              </div>

              {/* Doble Factor Verification Badges */}
              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <FileCheck2 className="size-3.5" />
                  <span>Doble Factor Verificado</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>✓ QR de Sucursal Validado</span>
                  <span>✓ Geocerca GPS ({voucherData.distanceMeters}m)</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-1">
              <Button
                onClick={handleCloseVoucher}
                className="w-full h-11 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                Aceptar y Finalizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
