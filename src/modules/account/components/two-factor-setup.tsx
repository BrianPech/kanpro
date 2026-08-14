"use client";

import * as React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Key,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getMFAFactors,
  enrollTOTP,
  verifyTOTP,
  unenrollTOTP,
} from "../services/account-security-service";

export interface FactorItem {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string;
  factor_type: string;
}

export function TwoFactorSetup() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [factors, setFactors] = React.useState<FactorItem[]>([]);

  // Setup flow state
  const [isEnrolling, setIsEnrolling] = React.useState<boolean>(false);
  const [enrollingLoading, setEnrollingLoading] = React.useState<boolean>(false);
  const [enrollmentData, setEnrollmentData] = React.useState<{
    id: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [otpCode, setOtpCode] = React.useState<string>("");
  const [verifying, setVerifying] = React.useState<boolean>(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = React.useState<boolean>(false);

  // Disable flow state
  const [isDisableDialogOpen, setIsDisableDialogOpen] = React.useState<boolean>(false);
  const [disabling, setDisabling] = React.useState<boolean>(false);

  const fetchFactors = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMFAFactors();
      const rawTotp = data?.totp || [];
      const rawAll = data?.all || [];
      const combined = [...rawTotp, ...rawAll];
      const totpFactors: FactorItem[] = combined.filter(
        (f: { factor_type: string }) => f.factor_type === "totp"
      ) as FactorItem[];
      
      // Deduplicate by ID
      const uniqueTotp = Array.from(new Map(totpFactors.map((item) => [item.id, item])).values());
      setFactors(uniqueTotp);
    } catch (err: unknown) {
      console.error("Error al cargar factores MFA:", err);
      toast.error("No se pudieron cargar los factores de seguridad.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const activeFactor = React.useMemo(() => {
    return factors.find((f: FactorItem) => f.status === "verified");
  }, [factors]);

  const handleStartEnroll = async () => {
    setEnrollingLoading(true);
    setVerifyError(null);
    setOtpCode("");
    try {
      const data = await enrollTOTP();
      if (data && data.totp) {
        setEnrollmentData({
          id: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
        });
        setIsEnrolling(true);
      } else {
        throw new Error("Respuesta de enrolamiento incompleta.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar configuración 2FA";
      toast.error(msg);
    } finally {
      setEnrollingLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || otpCode.length !== 6) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await verifyTOTP(enrollmentData.id, "", otpCode);
      toast.success("¡Autenticación de dos factores activada con éxito!");
      setIsEnrolling(false);
      setEnrollmentData(null);
      setOtpCode("");
      await fetchFactors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código de verificación inválido.";
      setVerifyError(msg);
      toast.error("Error al verificar el código TOTP.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelEnroll = () => {
    setIsEnrolling(false);
    setEnrollmentData(null);
    setOtpCode("");
    setVerifyError(null);
  };

  const handleCopySecret = async () => {
    if (!enrollmentData?.secret) return;
    try {
      await navigator.clipboard.writeText(enrollmentData.secret);
      setCopiedSecret(true);
      toast.success("Clave secreta copiada al portapapeles");
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      toast.error("No se pudo copiar la clave secreta.");
    }
  };

  const handleConfirmDisable = async () => {
    if (!activeFactor) return;
    setDisabling(true);
    try {
      await unenrollTOTP(activeFactor.id);
      toast.success("Autenticación de dos factores desactivada.");
      setIsDisableDialogOpen(false);
      await fetchFactors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al desactivar 2FA.";
      toast.error(msg);
    } finally {
      setDisabling(false);
    }
  };

  // Render QR helper (handles SVG strings or data URIs)
  const renderQRCode = (qrCodeStr: string) => {
    if (qrCodeStr.startsWith("data:image/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrCodeStr}
          alt="Código QR para 2FA"
          className="w-44 h-44 rounded-xl border p-2 bg-white shadow-sm"
        />
      );
    }
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeStr)}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={svgDataUrl}
        alt="Código QR para 2FA"
        className="w-44 h-44 rounded-xl border p-2 bg-white shadow-sm"
      />
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Autenticación de Dos Factores (2FA)</CardTitle>
                <CardDescription>
                  Protege tu cuenta con verificación TOTP mediante Google Authenticator o similares.
                </CardDescription>
              </div>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : activeFactor ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Activo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1.5 px-3 py-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Desactivado
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verificando estado de seguridad...</span>
            </div>
          ) : isEnrolling && enrollmentData ? (
            // Formulario de enrolamiento activo
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background border shrink-0">
                    <QrCode className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">
                      Paso 1: Escanea el código QR
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Abre tu aplicación de autenticación (como Google Authenticator o Authy) y escanea la siguiente imagen:
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-2 pb-1">
                  {renderQRCode(enrollmentData.qrCode)}
                </div>

                <div className="space-y-1.5 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Key className="w-3.5 h-3.5 text-primary" /> ¿No puedes escanear el código?
                    </span>
                    <span>Ingresa la clave manualmente:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-1.5 text-xs font-mono bg-background border rounded-lg break-all select-all text-center">
                      {enrollmentData.secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopySecret}
                      className="shrink-0 gap-1.5"
                    >
                      {copiedSecret ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-foreground">
                    Paso 2: Ingresa el código de 6 dígitos
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Introduce el código que aparece en tu aplicación de autenticación para confirmar la vinculación:
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 pt-2">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      if (verifyError) setVerifyError(null);
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  {verifyError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{verifyError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeFactor ? (
            // Estado cuando 2FA ya está activo
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Tu cuenta está protegida con 2FA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada vez que inicies sesión en K&apos;anPro se te solicitará un código único generado por tu aplicación de autenticación.
              </p>
            </div>
          ) : (
            // Estado cuando 2FA está deshabilitado
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                La verificación en dos pasos agrega una capa adicional de seguridad a tu cuenta de K&apos;anPro. Requiere un código de 6 dígitos generado por tu teléfono para ingresar.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          {isEnrolling ? (
            <div className="flex items-center justify-between w-full gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEnroll}
                disabled={verifying}
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleVerify}
                disabled={otpCode.length !== 6 || verifying}
                className="gap-2 min-w-28"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Verificar y Activar</span>
                )}
              </Button>
            </div>
          ) : activeFactor ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">
                Configurado correctamente
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDisableDialogOpen(true)}
              >
                Desactivar 2FA
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">
                Recomendado para todas las cuentas
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleStartEnroll}
                disabled={enrollingLoading || loading}
                className="gap-2"
              >
                {enrollingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando...</span>
                  </>
                ) : (
                  <span>Configurar 2FA</span>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Modal de confirmación para desactivar 2FA */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              ¿Desactivar Autenticación de Dos Factores?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Si desactivas el 2FA, tu cuenta será menos segura y solo requerirá tu contraseña para acceder.
              ¿Estás seguro de que deseas continuar?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDisableDialogOpen(false)}
              disabled={disabling}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDisable}
              disabled={disabling}
              className="gap-2"
            >
              {disabling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Desactivando...</span>
                </>
              ) : (
                <span>Confirmar Desactivación</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
