import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { companyRegisterSchema, type CompanyRegisterValues } from "../schemas/register.schema";
import { authService } from "../services/auth-service";

export function useCompanyRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<CompanyRegisterValues>({
    resolver: zodResolver(companyRegisterSchema as any),
  });

  const onSubmit = async (data: CompanyRegisterValues) => {
    try {
      console.log("Iniciando registro...");
      await authService.signUpCompany(data);
      
      toast.success("Cuenta creada", {
        description: "Bienvenido a K'anPro. Serás redirigido al dashboard."
      });
      
      router.push("/dashboard/company");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error capturado en onSubmit:", error);
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
    onSubmit,
  };
}
