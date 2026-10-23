"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  recordEmployeeQrCheckInAction,
  type RecordEmployeeQrCheckInResponse,
} from "@/modules/candidate/actions/employee-attendance";
import type { EmployeeQrCheckInResult } from "@/modules/candidate/schemas/employee-attendance.schema";

interface EmployeeInfo {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
}

interface CheckInDirectClientViewProps {
  user: { id: string; email?: string } | null;
  employee: EmployeeInfo | null;
  branchParam?: string;
  companyParam?: string;
  tokenParam?: string;
  rawUrl: string;
}

export function CheckInDirectClientView({
  user,
  employee,
  branchParam,
  companyParam,
  tokenParam,
  rawUrl,
}: CheckInDirectClientViewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState<EmployeeQrCheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  const displayBranch = branchParam || "Sucursal Principal";
  const displayCompany = companyParam || "Empresa Afiliada";

  // Automatic check-in when user is authenticated employee
  const executeCheckIn = async () => {
    if (!user || !employee) return;
    setIsProcessing(true);
    setErrorMessage(null);

    let coords: { lat: number; lng: number } | undefined = undefined;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), 1800);
          navigator.geolocation.getCurrentPosition(
            (p) => {
              clearTimeout(timer);
              resolve(p);
            },
            () => {
              clearTimeout(timer);
              resolve(null);
            },
            { timeout: 1800, enableHighAccuracy: true }
          );
        });
        if (pos) {
          coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
        }
      } catch {
        // Non-blocking
      }
    }

    try {
      const currentFullUrl =
        typeof window !== "undefined" ? window.location.href : rawUrl;

      const res: RecordEmployeeQrCheckInResponse =
        await recordEmployeeQrCheckInAction({
          qrUrlOrToken: currentFullUrl,
          coordinates: coords,
        });

      if (res.success && res.data) {
        setSuccessResult(res.data);
      } else {
        setErrorMessage(
          res.error || "No fue posible registrar la asistencia con este código."
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error inesperado al registrar checada."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (user && employee && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      executeCheckIn();
    }
  }, [user, employee]);

  const initials = employee?.full_name
    ? employee.full_name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "CL";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 size-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Top Branding Header */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide">
            <Sparkles className="size-3.5" />
            <span>K&apos;anPro Checador Oficial</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Registro de Asistencia
          </h1>
          <p className="text-xs text-slate-400">
            Escaneo directo desde cámara de dispositivo
          </p>
        </div>

        {/* ── CASE 1: NOT AUTHENTICATED ── */}
        {!user && (
          <Card className="p-6 rounded-3xl bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
            {/* Branch Context Info */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Building2 className="size-3.5" />
                <span className="truncate">{displayCompany}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <MapPin className="size-4 text-emerald-400 shrink-0" />
                <span className="truncate">{displayBranch}</span>
              </div>
              {tokenParam && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 font-mono">
                  <ShieldCheck className="size-3 text-indigo-400" />
                  <span>Kiosco: {tokenParam}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center py-1">
              <div className="mx-auto size-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-2">
                <LogIn className="size-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                Inicia sesión para checar
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Para registrar tu asistencia en esta sucursal, ingresa con tu
                cuenta de colaborador en K&apos;anPro.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                render={
                  <Link
                    href={`/login?redirect=${encodeURIComponent(
                      typeof window !== "undefined"
                        ? window.location.pathname + window.location.search
                        : rawUrl
                    )}`}
                  />
                }
                className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25"
              >
                <LogIn className="size-4 mr-2" />
                <span>Iniciar Sesión en K&apos;anPro</span>
              </Button>

              <Button
                render={<Link href="/register/candidate" />}
                variant="outline"
                className="w-full h-10 rounded-2xl border-slate-800 hover:bg-slate-800/60 text-slate-300 font-semibold text-xs"
              >
                ¿No tienes cuenta? Regístrate aquí
              </Button>
            </div>
          </Card>
        )}

        {/* ── CASE 2: AUTHENTICATED BUT NO ACTIVE EMPLOYEE RECORD ── */}
        {user && !employee && (
          <Card className="p-6 rounded-3xl bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl space-y-4 text-center">
            <div className="mx-auto size-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">
                Colaborador no encontrado
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tu cuenta ({user.email}) no cuenta con un registro activo de
                empleado en esta empresa.
              </p>
            </div>
            <Button
              render={<Link href="/dashboard/candidate" />}
              className="w-full h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <span>Ir a mi Portal de Candidato</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Card>
        )}

        {/* ── CASE 3: PROCESSING STATE ── */}
        {user && employee && isProcessing && (
          <Card className="p-8 rounded-3xl bg-slate-900/90 border-slate-800 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="mx-auto size-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                Validando asistencia...
              </h3>
              <p className="text-xs text-slate-400">
                Verificando geolocalización y turno programado
              </p>
            </div>
          </Card>
        )}

        {/* ── CASE 4: SUCCESS CONFIRMATION ── */}
        {user && employee && !isProcessing && successResult && (
          <Card className="p-6 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/40 backdrop-blur-xl shadow-2xl space-y-5 text-center">
            {/* Animated Celebration Icon */}
            <div className="mx-auto size-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-1.5">
              <Badge
                variant="outline"
                className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50 text-xs px-3 py-1 font-bold uppercase tracking-wider"
              >
                {successResult.actionType === "check_out"
                  ? "Salida Registrada"
                  : "Entrada Registrada"}
              </Badge>
              <div className="text-4xl font-black font-mono text-white tracking-tight pt-1">
                {successResult.timeStr}
              </div>
              <p className="text-xs text-emerald-300/80 font-medium">
                {successResult.isLate
                  ? `Retardo registrado (+${successResult.delayMinutes} min)`
                  : "Marcaje a tiempo y puntual"}
              </p>
            </div>

            {/* Employee Card Container */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 flex items-center gap-3 text-left">
              <Avatar className="size-11 rounded-xl border border-emerald-500/30">
                {employee.avatar_url && (
                  <AvatarImage
                    src={employee.avatar_url}
                    alt={employee.full_name}
                  />
                )}
                <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-0.5 overflow-hidden flex-1">
                <h4 className="text-sm font-extrabold text-white truncate">
                  {employee.full_name}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {employee.job_title || "Colaborador"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-0.5 font-medium truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">
                    {successResult.branchName || displayBranch}
                  </span>
                </div>
              </div>
            </div>

            {/* Link to Employee Portal */}
            <Button
              render={<Link href="/dashboard/candidate" />}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30"
            >
              <span>Ir a mi Portal de Colaborador</span>
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* ── CASE 5: ERROR STATE ── */}
        {user && employee && !isProcessing && errorMessage && (
          <Card className="p-6 rounded-3xl bg-slate-900/90 border-rose-500/40 backdrop-blur-xl shadow-2xl space-y-4 text-center">
            <div className="mx-auto size-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <AlertCircle className="size-6" />
            </div>

            <div className="space-y-1.5 max-w-xs mx-auto">
              <h3 className="text-base font-extrabold text-white">
                No se pudo registrar la checada
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={executeCheckIn}
                className="w-full h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2"
              >
                <RefreshCw className="size-3.5" />
                <span>Reintentar Checada</span>
              </Button>

              <Button
                render={<Link href="/dashboard/candidate" />}
                variant="outline"
                className="w-full h-10 rounded-2xl border-slate-800 text-slate-300 font-semibold text-xs"
              >
                Ir al Portal del Colaborador
              </Button>
            </div>
          </Card>
        )}

        {/* Footer Info */}
        <div className="text-center pt-2 text-[11px] text-slate-500">
          <span>K&apos;anPro Control de Asistencia &bull; Cumplimiento LFT Art. 132</span>
        </div>
      </div>
    </div>
  );
}
