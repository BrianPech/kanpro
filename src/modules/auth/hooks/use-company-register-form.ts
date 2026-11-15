import { useState, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  companyRegisterCredentialsSchema,
  type CompanyRegisterCredentialsValues,
} from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useCompanyRegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);

  const credentialsForm = useForm<CompanyRegisterCredentialsValues>({
    resolver: zodResolver(companyRegisterCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const passwordValue = credentialsForm.watch("password") || "";
  const confirmPasswordValue = credentialsForm.watch("confirmPassword") || "";

  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: passwordValue.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasNumber: /[0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPasswordValue) return true;
    return passwordValue === confirmPasswordValue;
  }, [passwordValue, confirmPasswordValue]);

  const onRegisterSubmit: SubmitHandler<CompanyRegisterCredentialsValues> = async (data) => {
    try {
      setIsSubmitting(true);
      const response = await authService.signUpCompany({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (!response.session) {
        toast.success("Cuenta creada con éxito", {
          description: "Revisa tu correo electrónico para confirmar tu cuenta y continuar.",
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success("Cuenta creada con éxito", {
        description: "Completa tu perfil y registra tu primera empresa.",
      });

      router.push("/onboarding");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error en registro de credenciales de empresa:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "No se pudo crear la cuenta de empresa.";
      toast.error("Error al registrar", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthRegister = async (provider: "google") => {
    try {
      setIsSocialSubmitting(true);
      await authService.signInWithOAuth(provider, "company", "/onboarding");
    } catch (err: unknown) {
      console.error("Error en registro con Google:", err);
      const msg = err instanceof Error ? err.message : "No se pudo conectar con Google";
      toast.error("Error al registrarse con Google", { description: msg });
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  return {
    credentialsRegister: credentialsForm.register,
    credentialsErrors: credentialsForm.formState.errors,
    isSubmitting,
    isSocialSubmitting,
    handleOAuthRegister,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordCriteria,
    passwordsMatch,
    handleRegisterSubmit: credentialsForm.handleSubmit(onRegisterSubmit),
  };
}
