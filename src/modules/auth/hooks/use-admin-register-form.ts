import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminRegisterSchema, type AdminRegisterValues } from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useAdminRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<AdminRegisterValues>({
    resolver: zodResolver(adminRegisterSchema as any),
  });

  const onSubmit = async (data: AdminRegisterValues) => {
    try {
      console.log("Iniciando registro de administrador...");
      await authService.signUpAdmin(data);
      
      toast.success("Cuenta de Administrador creada", {
        description: "Bienvenido al Panel de Administración de K'anPro."
      });
      
      router.push("/dashboard/admin");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error capturado en onSubmit:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la cuenta de administrador.";
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
    onSubmit,
    trigger: form.trigger,
  };
}
