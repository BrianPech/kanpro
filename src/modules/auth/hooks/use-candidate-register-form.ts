import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { candidateRegisterSchema, type CandidateRegisterValues } from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useCandidateRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const form = useForm<CandidateRegisterValues>({
    resolver: zodResolver(candidateRegisterSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      whatsappNumber: "",
      email: "",
      password: "",
    }
  });

  const onSubmit: SubmitHandler<CandidateRegisterValues> = async (data) => {
    try {
      await authService.signUpCandidate(data);
      
      toast.success("Cuenta creada", {
        description: "Bienvenido a K'anPro. Serás redirigido al dashboard de Candidato."
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
        description: errorMessage
      });
    }
  };

  return {
    register: form.register,
    handleSubmit: (onValid: SubmitHandler<CandidateRegisterValues>) =>
      form.handleSubmit(onValid, (errors) => {
        console.error("Errores de validación de Zod:", errors);
        toast.error("Por favor rellena todos los campos requeridos con datos válidos.");
      }),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
    trigger: form.trigger,
    setValue: form.setValue,
    watch: form.watch,
  };
}
