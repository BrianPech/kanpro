import { SupportDataTable } from "@/modules/admin/components/support-data-table";
import { getSupportTickets } from "@/app/(dashboard)/dashboard/admin/support/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HeadphonesIcon,
  LifeBuoyIcon,
  CheckCircle2Icon,
  ClockIcon,
  TrendingUpIcon,
} from "lucide-react";

export default async function AdminSupportPage() {
  // Fetch real ticket data
  const tickets = await getSupportTickets();

  const openTickets = tickets.filter((t) => t.status === "abierto").length;
  const inProgressTickets = tickets.filter((t) => t.status === "en_proceso").length;
  const resolvedTickets = tickets.filter((t) => t.status === "resuelto" || t.status === "cerrado").length;
  const totalTickets = tickets.length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <HeadphonesIcon className="size-6 text-purple-500" />
          Portal de Soporte Técnico y Asistencia K’anPro
        </h1>
        <p className="text-xs text-muted-foreground">
          Atienda incidencias de usuarios, envíe notificaciones directas, acredite créditos a empresas e inspeccione perfiles con la Caja de Herramientas de Asistencia.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Tickets Abiertos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {openTickets}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <LifeBuoyIcon className="size-3.5 text-amber-500" />
                Pendientes
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Atención requerida{" "}
              <TrendingUpIcon className="size-4 text-amber-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Incidencias recibidas sin asignar
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>En Atención</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {inProgressTickets}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <HeadphonesIcon className="size-3.5 text-purple-500" />
                En Proceso
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Agente Asignado{" "}
              <HeadphonesIcon className="size-4 text-purple-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Tickets en seguimiento activo
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Tiempo de Respuesta</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              &lt; 15m
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ClockIcon className="size-3.5 text-blue-500" />
                SLA Objetivo
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Respuesta Exprés{" "}
              <ClockIcon className="size-4 text-blue-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Promedio de primera atención
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Incidencias Resueltas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {resolvedTickets}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CheckCircle2Icon className="size-3.5 text-green-500" />
                Completados
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              De {totalTickets} tickets totales{" "}
              <CheckCircle2Icon className="size-4 text-green-500" />
            </div>
            <div className="text-muted-foreground text-xs">
              Casos solucionados favorablemente
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Support Data Table */}
      <div>
        <SupportDataTable initialData={tickets} />
      </div>
    </div>
  );
}
