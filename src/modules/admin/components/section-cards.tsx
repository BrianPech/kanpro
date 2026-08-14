"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface SectionCardsProps {
  metrics?: {
    totalCandidates: number;
    totalCompanies: number;
    pendingVerifications: number;
    activeVacancies: number;
    totalApplications: number;
  };
}

export function SectionCards({ metrics }: SectionCardsProps) {
  const candidates = metrics?.totalCandidates ?? 0;
  const companies = metrics?.totalCompanies ?? 0;
  const verifications = metrics?.pendingVerifications ?? 0;
  const vacancies = metrics?.activeVacancies ?? 0;
  const applications = metrics?.totalApplications ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Candidatos Registrados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {candidates.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Activos
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Talento en el sureste{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Perfiles con datos y CVs
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Empresas en Plataforma</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {companies.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant={verifications > 0 ? "destructive" : "outline"}>
              {verifications > 0 ? `${verifications} pendientes` : "Verificadas"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {verifications > 0 ? "Requiere atención" : "Empresas validadas"}{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Validación fiscal y legal
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Vacantes Activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {vacancies.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Publicadas
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Ofertas laborales{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Oportunidades abiertas</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Postulaciones Totales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {applications.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              En proceso
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Conexiones de trabajo{" "}
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">Métrica de coincidencia</div>
        </CardFooter>
      </Card>
    </div>
  )
}
