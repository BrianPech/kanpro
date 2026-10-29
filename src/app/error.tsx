"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "@/components/ui/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global runtime error caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Algo no salió como esperábamos
      </h1>
      <p className="mt-4 text-base text-muted-foreground max-w-md">
        Ocurrió un error inesperado al procesar la solicitud. Puedes intentar nuevamente o regresar al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          onClick={() => reset()}
          variant="default"
          className="rounded-full px-6"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
        <Button render={<Link href="/" />} variant="outline" className="rounded-full px-6">
          <Home className="mr-2 h-4 w-4" />
          Ir al Inicio
        </Button>
      </div>
    </main>
  );
}
