"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageSquare, Phone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../services/auth-service";
import { PremiumTextField } from "./premium-text-field";

export function PhoneOtpAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      setPhoneError("Por favor ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.signInWithPhoneOtp(cleanPhone, channel);
      toast.success(
        channel === "whatsapp"
          ? "Código enviado por WhatsApp"
          : "Código enviado por SMS",
        {
          description: `Revisa tu ${
            channel === "whatsapp" ? "WhatsApp" : "mensajería SMS"
          } para obtener el código de 6 dígitos.`,
        }
      );
      setStep("code");
    } catch (error: unknown) {
      console.error("Error al enviar OTP:", error);
      let message = "No se pudo enviar el código de verificación.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("Error al enviar código", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError(null);

    const cleanToken = token.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setTokenError("Por favor ingresa el código de 6 dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
      const { role } = await authService.verifyPhoneOtp(cleanPhone, cleanToken);

      toast.success("¡Bienvenido de nuevo!");

      const redirectToParam =
        searchParams?.get("redirectTo") || searchParams?.get("next");
      const isValidRedirect =
        redirectToParam &&
        redirectToParam.startsWith("/") &&
        !redirectToParam.startsWith("//");

      if (isValidRedirect) {
        router.push(redirectToParam);
      } else if (role === "admin") {
        router.push("/dashboard/admin");
      } else if (role === "company") {
        router.push("/dashboard/company");
      } else {
        router.push("/dashboard/candidate/discovery");
      }

      router.refresh();
    } catch (error: unknown) {
      console.error("Error al verificar OTP:", error);
      let message = "Código de verificación inválido o expirado.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("Error al verificar código", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4" noValidate>
          {/* Phone input */}
          <PremiumTextField
            id="phone"
            label="Número de Teléfono"
            hintText="+52 55 1234 5678"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneError || undefined}
          />

          {/* Channel selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#2f3c4b] dark:text-zinc-300">
              Método de envío
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`h-[44px] rounded-[12px] border flex items-center justify-center gap-2 text-[14px] font-semibold transition-all cursor-pointer ${
                  channel === "whatsapp"
                    ? "border-[#25D366] bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 text-[#5c7c9b] dark:text-zinc-400 hover:border-slate-300"
                }`}
              >
                <MessageSquare className="size-4 text-[#25D366]" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`h-[44px] rounded-[12px] border flex items-center justify-center gap-2 text-[14px] font-semibold transition-all cursor-pointer ${
                  channel === "sms"
                    ? "border-[#1f2732] bg-[#1f2732]/10 text-[#1f2732] dark:bg-zinc-800 dark:text-zinc-100 shadow-xs"
                    : "border-slate-200 dark:border-zinc-800 text-[#5c7c9b] dark:text-zinc-400 hover:border-slate-300"
                }`}
              >
                <Phone className="size-4" />
                <span>SMS</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[56px] mt-2 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin text-white/80" />
                <span>Enviando código...</span>
              </>
            ) : (
              <span>Enviar Código</span>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4" noValidate>
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-[14px] border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-[#5c7c9b] dark:text-zinc-400">
            <span>
              Código enviado a <strong className="text-[#1f2732] dark:text-zinc-200">{phone}</strong> vía {channel === "whatsapp" ? "WhatsApp" : "SMS"}.
            </span>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-[#1f2732] dark:text-zinc-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              Editar
            </button>
          </div>

          <PremiumTextField
            id="otp-token"
            label="Código de Verificación (6 dígitos)"
            hintText="123456"
            type="text"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={tokenError || undefined}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[56px] mt-2 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin text-white/80" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Verificar e Iniciar Sesión</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
