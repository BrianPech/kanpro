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
    resolver: zodResolver(candidateRegisterSchema as any),
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
    } catch (error: unknown) {
      console.error("Error capturado en onSubmit de candidato:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
      toast.error("Error al registrar", {
        description: errorMessage
      });
    }
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
  };
}
