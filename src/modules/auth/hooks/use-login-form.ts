import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import { authService } from "../services/auth-service";

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const notice = searchParams?.get("notice");
    if (notice === "account-deleted") {
      toast.info("Cuenta desactivada correctamente", {
        description: "Tu solicitud de baja y derechos ARCO han sido procesados.",
      });
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // 1. Iniciar sesión a través de authService (que ejecuta validación Zod estricta)
      const { role } = await authService.signIn(values);

      toast.success("¡Bienvenido de nuevo!");

      // 2. Extract redirectTo parameter or default to role-based dashboard
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
      console.error("Error en inicio de sesión:", error);
      let errorMessage = "Credenciales inválidas.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error("Error al iniciar sesión", {
        description: errorMessage,
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
