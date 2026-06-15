import * as React from "react";
import { Wallet, CreditCard, Sparkles, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function BillingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Billetera y suscripciones</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Administra tus fondos, métodos de pago y revisa tus recibos y suscripciones activas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        
        {/* Wallet Balance Card */}
        <div className="glass-card rounded-[24px] p-6 flex flex-col justify-between md:col-span-1 min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Saldo en Billetera</span>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">$124.50 USD</h3>
            </div>
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary animate-pulse">
              <Wallet className="h-5.5 w-5.5" />
            </div>
          </div>
          <Button className="w-full rounded-full h-10 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 mt-4">
            Recargar fondos
          </Button>
        </div>

        {/* Active Plan / Subscription Card */}
        <div className="glass-card rounded-[24px] p-6 flex flex-col justify-between md:col-span-1 min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Plan de Cuenta</span>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">K&apos;anPro AI Pro</h3>
              <p className="text-xs text-muted-foreground">Próxima renovación: 14 de Julio, 2026</p>
            </div>
            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-500">
              <Sparkles className="h-5.5 w-5.5" />
            </div>
          </div>
          <Link href="/account/ai-plan" className="w-full">
            <Button variant="outline" className="w-full rounded-full h-10 border-border/60 font-semibold">
              Ver beneficios del plan
            </Button>
          </Link>
        </div>

        {/* Default Payment Method Card */}
        <div className="glass-card rounded-[24px] p-6 flex flex-col justify-between md:col-span-1 min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Método de Pago</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">Visa •••• 4242</span>
              </div>
              <p className="text-xs text-muted-foreground">Vence: 12/28</p>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
              <CreditCard className="h-5.5 w-5.5" />
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-full h-10 border-border/60 font-semibold gap-2">
            <Plus className="h-4 w-4" />
            Añadir método
          </Button>
        </div>

      </div>

      {/* Transaction History */}
      <div className="glass-card rounded-[24px] p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Historial de Transacciones</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-xs text-muted-foreground uppercase font-semibold">
                <th className="py-3 px-4">ID Recibo</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              
              <tr className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <td className="py-4 px-4 font-medium text-xs text-muted-foreground">#INV-9281</td>
                <td className="py-4 px-4 text-sm">14 Jun, 2026</td>
                <td className="py-4 px-4 text-sm font-semibold text-foreground">Mensualidad Plan K&apos;anPro AI Pro</td>
                <td className="py-4 px-4 text-sm">Visa •••• 4242</td>
                <td className="py-4 px-4">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Pagado</span>
                </td>
                <td className="py-4 px-4 text-right font-bold text-sm text-foreground">$29.00 USD</td>
              </tr>

              <tr className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <td className="py-4 px-4 font-medium text-xs text-muted-foreground">#INV-8732</td>
                <td className="py-4 px-4 text-sm">14 May, 2026</td>
                <td className="py-4 px-4 text-sm font-semibold text-foreground">Mensualidad Plan K&apos;anPro AI Pro</td>
                <td className="py-4 px-4 text-sm">Visa •••• 4242</td>
                <td className="py-4 px-4">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Pagado</span>
                </td>
                <td className="py-4 px-4 text-right font-bold text-sm text-foreground">$29.00 USD</td>
              </tr>

              <tr className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <td className="py-4 px-4 font-medium text-xs text-muted-foreground">#INV-8120</td>
                <td className="py-4 px-4 text-sm">28 Abr, 2026</td>
                <td className="py-4 px-4 text-sm font-semibold text-foreground">Recarga de Saldo Billetera</td>
                <td className="py-4 px-4 text-sm">Visa •••• 4242</td>
                <td className="py-4 px-4">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Completado</span>
                </td>
                <td className="py-4 px-4 text-right font-bold text-sm text-foreground">$100.00 USD</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
