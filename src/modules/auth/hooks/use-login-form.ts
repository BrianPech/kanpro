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

      // 2. Consulta inmediata del perfil en profiles utilizando el id del usuario
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, location")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("No se encontró el perfil de usuario asociado.");
      }

      const role = profile.role;
      const location = profile.location || "";
      const hasLocation = location.includes(" - ");

      toast.success("¡Bienvenido de nuevo!");

      // 3. Ejecutar las condiciones de enrutamiento inteligente
      if (role === "admin") {
        router.push("/dashboard/admin");
      } else if ((role === "candidate" || role === "company") && !hasLocation) {
        router.push("/onboarding");
      } else if (role === "candidate" && hasLocation) {
        router.push("/dashboard/candidate/discovery");
      } else if (role === "company" && hasLocation) {
        router.push("/dashboard/company/radar");
      } else {
        router.push(`/dashboard/${role}`);
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
