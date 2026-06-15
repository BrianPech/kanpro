import * as React from "react";
import { Key, Laptop, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SecurityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Seguridad y acceso</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Configuraciones y herramientas para mantener tu cuenta segura y protegida.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        
        {/* Change Password Card */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Key className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Cambiar Contraseña</h3>
          </div>

          <form className="space-y-6" method="POST">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input 
                  id="currentPassword" 
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-[12px] bg-background/50 focus-visible:ring-primary/20"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button type="button" className="rounded-full h-11 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                Actualizar contraseña
              </Button>
            </div>

          </form>
        </div>

        {/* Two-Factor Auth */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-4 flex items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Verificación de dos pasos (2FA)</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Añade una capa extra de seguridad para evitar que otras personas accedan a tu cuenta.
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-10 px-5 border-border/60 shrink-0">
            Configurar 2FA
          </Button>
        </div>

        {/* Active Devices / Sessions */}
        <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Laptop className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Tus dispositivos activos</h3>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-3 py-1 rounded-full">2 Sesiones Activas</span>
          </div>

          <div className="space-y-4">
            
            {/* Device 1 */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted/60 rounded-xl flex items-center justify-center text-foreground">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">macOS Ventura • Chrome</h4>
                  <p className="text-xs text-muted-foreground">Lima, Perú • Sesión actual</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2.5 py-1 rounded">Este dispositivo</span>
            </div>

            {/* Device 2 */}
            <div className="flex items-center justify-between py-2 border-t border-border/20">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted/60 rounded-xl flex items-center justify-center text-foreground">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">iPhone 15 Pro • Safari</h4>
                  <p className="text-xs text-muted-foreground">Lima, Perú • Hace 2 horas</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive">
                Cerrar sesión
              </Button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
