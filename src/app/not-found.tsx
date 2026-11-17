import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Home } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Compass className="h-10 w-10 animate-pulse" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        404 - Página no encontrada
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        La página que buscas no existe o ha sido movida. Explora las vacantes o regresa al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button nativeButton={false} render={<Link href="/" />} variant="default" className="rounded-full px-6">
          <Home className="mr-2 h-4 w-4" />
          Ir al Inicio
        </Button>
        <Button nativeButton={false} render={<Link href="/dashboard/candidate/discovery" />} variant="outline" className="rounded-full px-6">
          Explorar Vacantes
        </Button>
      </div>
    </main>
  );
}
