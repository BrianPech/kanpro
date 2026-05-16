import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { candidateRegisterSchema, type CandidateRegisterValues } from "../schemas/register.schema";

export function useCandidateRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CandidateRegisterValues>({
    resolver: zodResolver(candidateRegisterSchema as any),
  });

  const onSubmit = async (data: CandidateRegisterValues) => {
    console.log("Candidate Registration:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
