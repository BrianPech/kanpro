import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginFormValues } from "../schemas/login.schema";
import { createClient } from "@/lib/supabase/client";

export function useLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const supabase = createClient();
    try {
      // 1. Iniciar sesión con email y contraseña
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("No se pudieron obtener los datos del usuario autenticado.");
      }

      // 2. Obtener rol desde user_metadata o perfil de forma segura
      const role = authData.user.user_metadata?.role || "candidate";

      toast.success("¡Bienvenido de nuevo!");

      // 3. Ejecutar las condiciones de enrutamiento directo
      if (role === "admin") {
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
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String((error as any).message);
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
