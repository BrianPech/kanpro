import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  candidateRegisterCredentialsSchema,
  type CandidateRegisterCredentialsValues,
} from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useCandidateRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<CandidateRegisterCredentialsValues>({
    resolver: zodResolver(candidateRegisterCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<CandidateRegisterCredentialsValues> = async (
    data
  ) => {
    try {
      const response = await authService.signUpCandidateCredentials(data);

      if (!response.session || !response.user?.email_confirmed_at) {
        toast.success("Cuenta creada", {
          description:
            "Por favor confirma tu correo electrónico para activar tu cuenta.",
        });
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      toast.success("Cuenta creada", {
        description:
          "Bienvenido a K'anPro. Prepara tu INE para completar tu perfil.",
      });

      router.push("/register/candidate/ine");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error capturado en onSubmit de candidato:", error);
      let errorMessage =
        "No se pudo crear la cuenta de candidato. Inténtalo de nuevo.";

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

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    showPassword,
    setShowPassword,
    watch: form.watch,
  };
}
