"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useCandidateRegisterForm } from "../hooks/use-candidate-register-form";

// Custom Facebook Icon SVG
const FacebookIcon = () => (
  <svg className="h-4.5 w-4.5 fill-[#1877F2] text-[#1877F2] shrink-0" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Custom Google Icon SVG
const GoogleIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.2 3.73 1.24 7.7l3.96 3.07C6.18 7.55 8.84 5.04 12 5.04z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.57v2.96h3.87c2.26-2.08 3.56-5.14 3.56-8.68z"
    />
    <path
      fill="#FBBC05"
      d="M5.2 10.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.24 3.16C.45 4.74 0 6.51 0 8.5s.45 3.76 1.24 5.34l3.96-3.07z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.87-2.96c-1.08.72-2.47 1.16-4.09 1.16-3.16 0-5.82-2.51-6.8-5.73L1.24 13.62C3.2 17.58 7.24 23 12 23z"
    />
  </svg>
);

export function CandidateRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
  } = useCandidateRegisterForm();

  return (
    <main className="h-screen w-full flex bg-background text-foreground font-sans transition-colors duration-300 overflow-hidden">

      {/* Left Column: Registration Form */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-between p-6 md:p-8 lg:p-10 shrink-0 h-full overflow-y-auto">

        {/* Header Link */}
        <Link
          href="/register"
          className="flex items-center gap-2 text-[14px] font-bold text-muted-foreground hover:text-foreground transition-all w-fit group active:scale-[0.98] shrink-0"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver
        </Link>

        {/* Form Content */}
        <div className="w-full max-w-[340px] mx-auto flex flex-col gap-5 my-auto py-4 shrink-0">

          {/* Logo */}
          <div className="flex justify-center md:justify-start items-center gap-2">
            <span className="text-[24px] font-bold tracking-tighter text-foreground">
              K&apos;anPro
            </span>
          </div>

          {/* Title */}
          <div className="text-center md:text-left">
            <h1 className="text-[28px] md:text-[32px] font-extrabold text-foreground tracking-[-0.04em] leading-tight">
              Start your career
            </h1>
          </div>

          {/* Social Logins Blob (mimicking reference style, only Google and Facebook) */}
          <div className="flex justify-center items-center gap-3 py-1.5 px-4 bg-muted/60 dark:bg-zinc-900 rounded-full w-fit mx-auto md:mx-0 border border-border/40">
            <button
              type="button"
              className="w-8.5 h-8.5 rounded-full bg-background hover:bg-muted/80 flex items-center justify-center transition-all shadow-xs active:scale-95 border border-border/30"
              aria-label="Registrarse con Google"
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              className="w-8.5 h-8.5 rounded-full bg-background hover:bg-muted/80 flex items-center justify-center transition-all shadow-xs active:scale-95 border border-border/30"
              aria-label="Registrarse con Facebook"
            >
              <FacebookIcon />
            </button>
          </div>

          <div className="text-center md:text-left text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            or
          </div>

          {/* Flat Pill Inputs */}
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)} method="POST" noValidate>

            {/* Full Name */}
            <div className="flex flex-col gap-0.5">
              <div className="relative group/input">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="fullName"
                  placeholder="Full name"
                  {...register("fullName")}
                  className="h-[48px] pl-12 pr-5 bg-muted/60 dark:bg-zinc-900/60 text-[14px] border-0 focus-visible:ring-primary/20 focus-visible:bg-muted/80 transition-all font-semibold placeholder:text-muted-foreground/60 rounded-full text-foreground shadow-none"
                  aria-invalid={!!errors.fullName}
                />
              </div>
              {errors.fullName && <FieldError errors={[errors.fullName]} />}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-0.5">
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  {...register("email")}
                  className="h-[48px] pl-12 pr-5 bg-muted/60 dark:bg-zinc-900/60 text-[14px] border-0 focus-visible:ring-primary/20 focus-visible:bg-muted/80 transition-all font-semibold placeholder:text-muted-foreground/60 rounded-full text-foreground shadow-none"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <FieldError errors={[errors.email]} />}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-0.5">
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="password"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="w-full h-[48px] pl-12 pr-12 bg-muted/60 dark:bg-zinc-900/60 text-[14px] border-0 focus-visible:ring-primary/20 focus-visible:bg-muted/80 transition-all font-semibold placeholder:text-muted-foreground/60 rounded-full text-foreground shadow-none"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && <FieldError errors={[errors.password]} />}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-0.5">
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  placeholder="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className="w-full h-[48px] pl-12 pr-12 bg-muted/60 dark:bg-zinc-900/60 text-[14px] border-0 focus-visible:ring-primary/20 focus-visible:bg-muted/80 transition-all font-semibold placeholder:text-muted-foreground/60 rounded-full text-foreground shadow-none"
                  aria-invalid={!!errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer focus:outline-none p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && <FieldError errors={[errors.confirmPassword]} />}
            </div>

            {/* Solid Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[48px] w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[15px] shadow-sm tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border-0"
            >
              {isSubmitting ? "Creating..." : "Start"}
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="text-[14px] text-muted-foreground text-center md:text-left font-semibold shrink-0">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[15px] font-black text-primary hover:underline ml-0.5 transition-colors tracking-[0.2px]"
          >
            Log in
          </Link>
        </p>

      </div>

      {/* Right Column: High Fidelity Image (Visible only on md+) */}
      <div className="hidden md:block md:w-[55%] lg:w-[60%] p-3 relative shrink-0 h-full">
        <div className="w-full h-full rounded-[24px] overflow-hidden relative border border-border/30">

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/workspace_register_bg.png"
            alt="K'anPro Workspace View"
            className="w-full h-full object-cover select-none pointer-events-none"
          />

        </div>
      </div>

    </main>
  );
}
