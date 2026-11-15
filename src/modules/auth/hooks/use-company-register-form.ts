import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { companyRegisterSchema } from "../schemas/register.schema";
import { authService } from "../services/auth-service";

const companyCredentialsSchema = companyRegisterSchema.pick({
  email: true,
  password: true,
});

type CompanyCredentialsValues = z.infer<typeof companyCredentialsSchema>;

export function useCompanyRegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const credentialsForm = useForm<CompanyCredentialsValues>({
    resolver: zodResolver(companyCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onRegisterSubmit: SubmitHandler<CompanyCredentialsValues> = async (
    data
  ) => {
    try {
      setIsSubmitting(true);
      const response = await authService.signUpCompany({
        email: data.email,
        password: data.password,
      });

      if (!response.session) {
        toast.success("Cuenta creada con éxito", {
          description:
            "Revisa tu correo electrónico para confirmar tu cuenta y continuar.",
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

  return {
    credentialsRegister: credentialsForm.register,
    credentialsErrors: credentialsForm.formState.errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleRegisterSubmit: credentialsForm.handleSubmit(onRegisterSubmit),
  };
}
