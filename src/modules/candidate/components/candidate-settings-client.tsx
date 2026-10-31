"use client";

import * as React from "react";
import { Shield, Key, Bell, User, Lock, Trash2, ArrowRight } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChangePasswordForm,
  ChangeEmailForm,
  TwoFactorSetup,
  ActiveSessionsCard,
} from "@/modules/account/components";
import { DeleteAccountModal } from "@/modules/account/components/delete-account-modal";

interface CandidateSettingsClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function CandidateSettingsClient({ user }: CandidateSettingsClientProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuración y Seguridad
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
          Administra la seguridad de tu acceso, autenticación de dos pasos, sesiones activas y preferencias de privacidad.
        </p>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted/60 p-1 rounded-3xl">
          <TabsTrigger value="security" className="rounded-3xl text-xs font-semibold gap-1.5">
            <Key className="size-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-3xl text-xs font-semibold gap-1.5">
            <Lock className="size-3.5" />
            Privacidad
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-3xl text-xs font-semibold gap-1.5">
            <Bell className="size-3.5" />
            Alertas
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Seguridad */}
        <TabsContent value="security" className="space-y-4">
          <ChangePasswordForm />
          <ChangeEmailForm />
          <TwoFactorSetup />
          <ActiveSessionsCard />
        </TabsContent>

        {/* Tab 2: Privacidad y Cuenta */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="rounded-4xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-3xl text-primary">
                  <User className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Datos del Perfil Público</CardTitle>
                  <CardDescription className="text-xs">
                    Tu nombre y expediente digital se muestran a reclutadores verificados en el Sureste.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Puedes editar en cualquier momento tu CV, número de WhatsApp para contacto directo y las zonas de trabajo preferidas.
              </p>
              <Link href="/dashboard/candidate/profile/edit">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-4xl text-xs font-semibold">
                  Editar información de perfil
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-4xl border-destructive/20 bg-destructive/5 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-destructive/10 rounded-3xl text-destructive">
                  <Trash2 className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-destructive">Zona de Peligro</CardTitle>
                  <CardDescription className="text-xs">
                    Eliminación permanente de tu cuenta y expediente laboral.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al eliminar tu cuenta, se revocarán todos los accesos a tus documentos oficiales y se retirarán tus postulaciones activas.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-9 px-4 rounded-4xl text-xs font-semibold"
              >
                Eliminar mi cuenta de K&apos;anPro
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Alertas y Notificaciones */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="rounded-4xl border-border/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-3xl text-primary">
                  <Bell className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Alertas de Vacantes por WhatsApp & Email</CardTitle>
                  <CardDescription className="text-xs">
                    Configura avisos automáticos cuando surjan ofertas que coincidan con tu perfil.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gestiona la frecuencia de notificaciones, rangos de salario deseados y municipios de interés en Yucatán y la Riviera Maya.
              </p>
              <Link href="/dashboard/candidate/notifications/preferences">
                <Button className="h-9 px-4 rounded-4xl text-xs font-semibold shadow-xs">
                  Configurar Alertas de Empleo
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      />
    </div>
  );
}
