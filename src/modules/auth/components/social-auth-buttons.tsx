"use client";

import React, { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../services/auth-service";
import type { UserRole } from "../types/auth.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SocialAuthButtonsProps {
  role?: UserRole;
  redirectTo?: string;
  className?: string;
  onPhoneClick?: () => void;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0", className)} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0 fill-[#0A66C2]", className)} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 shrink-0 fill-[#25D366]", className)} viewBox="0 0 24 24">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.05 20.21c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.01 4.54-3.68 8.29-8.43 8.29z"/>
    </svg>
  );
}

export function SocialAuthButtons({
  role = "candidate",
  redirectTo,
  className,
  onPhoneClick,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "linkedin_oidc" | null
  >(null);

  const handleOAuthSignIn = async (provider: "google" | "linkedin_oidc") => {
    try {
      setLoadingProvider(provider);
      await authService.signInWithOAuth(provider, role, redirectTo);
    } catch (error: unknown) {
      console.error(`Error de autenticación con ${provider}:`, error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servicio de autenticación.";
      toast.error(
        `Error al iniciar sesión con ${
          provider === "google" ? "Google" : "LinkedIn"
        }`,
        { description: message }
      );
      setLoadingProvider(null);
    }
  };

  const isLoading = loadingProvider !== null;

  return (
    <div
      className={cn(
        "grid gap-2.5 w-full",
        onPhoneClick ? "grid-cols-3" : "grid-cols-2",
        className
      )}
    >
      {/* Google Button */}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => handleOAuthSignIn("google")}
        className="h-11 px-2.5 rounded-xl border-border bg-background hover:bg-muted font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <GoogleIcon />
        )}
        <span className="truncate">Google</span>
      </Button>

      {/* LinkedIn Button */}
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => handleOAuthSignIn("linkedin_oidc")}
        className="h-11 px-2.5 rounded-xl border-border bg-background hover:bg-muted font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loadingProvider === "linkedin_oidc" ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <LinkedInIcon />
        )}
        <span className="truncate">LinkedIn</span>
      </Button>

      {/* WhatsApp / SMS Button */}
      {onPhoneClick && (
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={onPhoneClick}
          className="h-11 px-2.5 rounded-xl border-border bg-background hover:bg-muted font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-[#1f2732] dark:text-zinc-200 hover:border-[#25D366]/40"
        >
          <WhatsAppIcon />
          <span className="truncate">SMS / WA</span>
        </Button>
      )}
    </div>
  );
}
