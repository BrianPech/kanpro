import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  candidateRegisterSchema,
  type CandidateRegisterValues,
  type CandidateRegisterInput,
} from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useCandidateRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<CandidateRegisterInput, unknown, CandidateRegisterValues>({
    resolver: zodResolver(candidateRegisterSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      whatsappNumber: "",
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<CandidateRegisterValues> = async (data) => {
    try {
      const response = await authService.signUpCandidate(data);

      if (!response.session || !response.user?.email_confirmed_at) {
        toast.success("Cuenta creada", {
          description: "Por favor confirma tu correo electrónico para activar tu cuenta.",
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success("Cuenta creada", {
        description: "Bienvenido a K'anPro. Serás redirigido al panel de Candidato.",
      });
      
      router.push("/dashboard/candidate");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error capturado en onSubmit de candidato:", error);
      let errorMessage = "No se pudo crear la cuenta de candidato. Inténtalo de nuevo.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error("Error al registrar", {
        description: errorMessage,
      });
    }
  };

  const handleOAuthRegister = async (provider: "google") => {
    try {
      setIsSocialSubmitting(true);
      await authService.signInWithOAuth(provider, "candidate");
    } catch (err: unknown) {
      console.error("Error en registro con Google:", err);
      const msg = err instanceof Error ? err.message : "No se pudo conectar con Google";
      toast.error("Error al registrarse con Google", { description: msg });
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  return {
    register: form.register,
    handleSubmit: (onValid: SubmitHandler<CandidateRegisterValues>) =>
      form.handleSubmit(onValid, (errors) => {
        console.error("Errores de validación de Zod:", errors);
        const firstErrorKey = Object.keys(errors)[0] as keyof typeof errors | undefined;
        const firstErrorMsg = firstErrorKey ? errors[firstErrorKey]?.message : undefined;
        toast.error("Por favor completa los campos requeridos", {
          description: typeof firstErrorMsg === "string" ? firstErrorMsg : "Revisa los campos marcados en rojo.",
        });
      }),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isSocialSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
    handleOAuthRegister,
    trigger: form.trigger,
    setValue: form.setValue,
    watch: form.watch,
    formState: form.formState,
  };
}
