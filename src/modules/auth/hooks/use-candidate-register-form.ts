import { useState } from "react";
import { useForm } from "react-hook-form";
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
      email: "",
      password: "",
      confirmPassword: "",
    }
  });

  const onSubmit = async (data: CandidateRegisterValues) => {
    try {
      console.log("Iniciando registro de candidato...");
      await authService.signUpCandidate(data);
      
      toast.success("Cuenta creada", {
        description: "Bienvenido a K'anPro. Serás redirigido al dashboard de Candidato."
      });
      
      router.push("/dashboard/candidate");
      router.refresh();
    } catch (error: any) {
      console.error("Error capturado en onSubmit de candidato:", error);
      if (error && typeof error === "object") {
        console.error("Detalles del error - Status:", error.status, "Código:", error.code);
      }

      let errorMessage = "No se pudo crear la cuenta de candidato. Inténtalo de nuevo.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String(error.message);
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
    handleSubmit: (onValid: any) => form.handleSubmit(onValid, (errors) => {
      console.error("❌ Errores de validación ocultos de Zod:", errors);
      toast.error("Por favor rellena todos los campos requeridos.");
    }),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
    trigger: form.trigger,
  };
}
