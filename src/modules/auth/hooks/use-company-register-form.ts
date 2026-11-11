import { useState, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  companyRegisterCredentialsSchema,
  companyOnboardingIdentitySchema,
  type CompanyRegisterCredentialsValues,
  type CompanyOnboardingIdentityValues,
  type CompanyOnboardingOperationsValues,
} from "../schemas/register.schema";
import { authService } from "../services/auth-service";
import { companyService } from "@/modules/company/services/company-service";
import { createCompanyAction } from "@/modules/company/actions/tenant-actions";
import { createClient } from "@/lib/supabase/client";

export function useCompanyRegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredUserEmail, setRegisteredUserEmail] = useState<string | null>(null);

  // Step 1: Formulario de Registro (Email, Contraseña, Confirmar Contraseña)
  const credentialsForm = useForm<CompanyRegisterCredentialsValues>({
    resolver: zodResolver(companyRegisterCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  // Step 2: Onboarding - Identidad de la Empresa (Nombre de la empresa, contacto, RFC)
  const identityForm = useForm<CompanyOnboardingIdentityValues>({
    resolver: zodResolver(companyOnboardingIdentitySchema),
    defaultValues: {
      company_name: "",
      contact_phone: "",
      rfc: "",
    },
    mode: "onTouched",
  });

  // Step 3: Onboarding - Operación y Ubicación
  const [operations, setOperations] = useState<CompanyOnboardingOperationsValues>({
    industry: "Hotelería & Turismo",
    location: "Mérida, Yucatán",
    company_size: "11-50",
    address_details: "",
    latitude: 20.9676,
    longitude: -89.6241,
  });

  const passwordValue = credentialsForm.watch("password") || "";
  const confirmPasswordValue = credentialsForm.watch("confirmPassword") || "";

  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: passwordValue.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasNumber: /[0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPasswordValue) return true;
    return passwordValue === confirmPasswordValue;
  }, [passwordValue, confirmPasswordValue]);

  // Handler Step 1: Registro de la cuenta
  const onRegisterSubmit: SubmitHandler<CompanyRegisterCredentialsValues> = async (data) => {
    try {
      setIsSubmitting(true);
      const response = await authService.signUpCompany({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.user) {
        setRegisteredUserId(response.user.id);
        setRegisteredUserEmail(data.email);
      }

      toast.success("Cuenta creada con éxito", {
        description: "Configura los datos de tu empresa para comenzar.",
      });

      // Avanzar al Paso 2 del Onboarding (solicitud de nombre de la empresa)
      setCurrentStep(2);
    } catch (error: unknown) {
      console.error("Error en registro de credenciales de empresa:", error);
      let errorMessage = "No se pudo crear la cuenta de empresa.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      toast.error("Error al registrar", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Step 2: Avanzar de Identidad a Giro y Ubicación
  const onIdentitySubmit: SubmitHandler<CompanyOnboardingIdentityValues> = () => {
    setCurrentStep(3);
  };

  // Handler Step 3: Finalizar Onboarding y guardar perfil
  const onFinishOnboarding = async () => {
    try {
      setIsFinishing(true);
      const identityData = identityForm.getValues();
      const companyName = identityData.company_name?.trim() || "Mi Empresa";

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const targetUserId = user?.id || registeredUserId;

      const res = await createCompanyAction({
        company_name: companyName,
        industry: operations.industry,
        location: operations.location,
        address_details: operations.address_details || undefined,
        contact_phone: identityData.contact_phone?.trim() || undefined,
        rfc: identityData.rfc?.trim() || undefined,
        company_size: operations.company_size,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success("¡Espacio de empresa configurado!", {
        description: "Bienvenido a K'anPro. Serás redirigido a tu panel.",
      });

      router.push("/dashboard/company");
      router.refresh();
    } catch (error: unknown) {
      console.error("Error al finalizar onboarding de empresa:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuración de la empresa.";
      toast.error("Error al configurar empresa", {
        description: msg,
      });
      // Aun si falla la actualización del perfil, la cuenta ya existe; permitimos ir al panel
      router.push("/dashboard/company");
      router.refresh();
    } finally {
      setIsFinishing(false);
    }
  };

  const onSkipOnboarding = () => {
    toast.info("Configuración omitida", {
      description: "Puedes completar los datos de tu empresa en Ajustes más adelante.",
    });
    router.push("/dashboard/company");
    router.refresh();
  };

  const handleOAuthRegister = async (provider: "google") => {
    try {
      setIsSocialSubmitting(true);
      await authService.signInWithOAuth(provider, "company");
    } catch (err: unknown) {
      console.error("Error en registro con Google:", err);
      const msg = err instanceof Error ? err.message : "No se pudo conectar con Google";
      toast.error("Error al registrarse con Google", { description: msg });
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    // Step 1
    credentialsForm,
    credentialsRegister: credentialsForm.register,
    credentialsErrors: credentialsForm.formState.errors,
    credentialsWatch: credentialsForm.watch,
    isSubmitting,
    isSocialSubmitting,
    handleOAuthRegister,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordCriteria,
    passwordsMatch,
    handleRegisterSubmit: credentialsForm.handleSubmit(onRegisterSubmit),
    // Step 2
    identityForm,
    identityRegister: identityForm.register,
    identityErrors: identityForm.formState.errors,
    identityWatch: identityForm.watch,
    handleIdentitySubmit: identityForm.handleSubmit(onIdentitySubmit),
    // Step 3
    operations,
    setIndustry: (ind: string) =>
      setOperations((prev) => ({ ...prev, industry: ind })),
    setLocation: (loc: string) =>
      setOperations((prev) => ({ ...prev, location: loc })),
    setAddressDetails: (addr: string) =>
      setOperations((prev) => ({ ...prev, address_details: addr })),
    setFullLocation: (data: {
      location?: string;
      address_details?: string;
      latitude?: number;
      longitude?: number;
    }) =>
      setOperations((prev) => ({
        ...prev,
        ...(data.location ? { location: data.location } : {}),
        ...(data.address_details !== undefined
          ? { address_details: data.address_details }
          : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
      })),
    setCompanySize: (size: string) =>
      setOperations((prev) => ({ ...prev, company_size: size })),
    isFinishing,
    handleFinishOnboarding: onFinishOnboarding,
    handleSkipOnboarding: onSkipOnboarding,
    registeredUserEmail,
  };
}
