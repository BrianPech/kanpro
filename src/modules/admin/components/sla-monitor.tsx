"use client";

import * as React from "react";
import { 
  Search, 
  Filter, 
  Download, 
  Bolt, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SlaRequest {
  id: string;
  name: string;
  avatar: string;
  role: string;
  vacancy: string;
  companyName: string;
  companyInitials: string;
  waitingTime: string;
  hours: number;
  status: "critical" | "observation" | "normal";
}

const initialRequests: SlaRequest[] = [
  {
    id: "r1",
    name: "Julianne Sterling",
    role: "Senior Product Designer",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnjaPVMmrh80PqxBOplM5qayVXL1qPDXj-vqaUcUMI0ASK4KT_XfobZ_Kyui2saiB_8dzm9XnB_AmOfB3BgG6pjHYW2VThwXDjcF2ii-pdY_Q1C-f8er1dczrZUviCQNOTo9g_xPhdehjVwyga9uVTmWKYI4DtecexZOkw3_oNbfwE9B-iQ71cSvRwyEdC_xLaYMlp9tf4TD-bsGe1RRZA25Os0wHQ1WgLstc_Tr9Ajw-1PXmR1FO7ry6oGUBvlfFpxR18y69g65Q",
    vacancy: "Lead UX Architect",
    companyName: "Globant",
    companyInitials: "GL",
    waitingTime: "32h 15m",
    hours: 32.25,
    status: "critical"
  },
  {
    id: "r2",
    name: "Marcus Rhodes",
    role: "DevOps Lead",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDK0wcNllQotNyF-EmlP9EJkViHyA4uK-DHQmmVthrSzhoPj9SUKUxljcoTCroGLazPE0roJQMzZBcbRHaSbYnvG7apoHa8GvFGBzb0mjAbs0uDbtm48yTXEsdO0nXAHea0bGPFLniYV7l-567C9n_-ekjBsIQn7hJtovTeNsjgqxLzT97Zx144AgjSFKYcwSdXG2u6PQm1xmKV7MYxcaA1BET7rd8lI2XEPRJdSRcUBgXVJ19jw9SZsaMZKLC2DobBBIeNbl-Pzyw",
    vacancy: "Site Reliability Eng.",
    companyName: "Amazon",
    companyInitials: "AM",
    waitingTime: "18h 42m",
    hours: 18.7,
    status: "observation"
  },
  {
    id: "r3",
    name: "Lydia Hayes",
    role: "Fullstack Engineer",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ96bE4NqTCxujy3iKdmnILYobJUhGY9xI3Rr8yhIa41EyP08CuVi8Vu4FKqpPtki9s1hlNrk4F_fwZWViJ3gYUYbrJ__jJq6RECERmDY0Ts6ghxMtngmX0ZJRpTWSWnRbK_OooMEnl-Ong9OFPKeUitYRNUGIwEFuGTUbU0LqHfYQvEmLOmJfX125LLi3IVIVg0WPhIPSaZ6S7l_u1BKt7uJyHGHE3wWsNOZqC15J6ysZB_yAv96FelqM_b79_IeA9ZtoA9v6kV4",
    vacancy: "Senior Java Developer",
    companyName: "Stripe",
    companyInitials: "ST",
    waitingTime: "04h 12m",
    hours: 4.2,
    status: "normal"
  },
  {
    id: "r4",
    name: "Evan Kim",
    role: "ML Researcher",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4Ssq3TBqi3Tq_meoAY8ZTAS_1E28egZCZ6AMcfyK7IsCLUWHZ7oACQBuHfBFJcESEgAeLCL3dJ5TWPVlTyQBvAMmIsc6G9y0zqiEUrLvcoG2RbgGFCXI7fNFw5SZF7LLAmrE9YvtFq8Hw4LxScjuDkXkTpZqd4vyWK2uk3faSXCepGpr5B2GXPASEn2CwrZzutGSHzGE4OBdQ68NiDdI59d0o_5LsbsqTc1HA4LNfVLZdlX5ENnn3Lp-0gPKVEfwFnit9M3AJLwQ",
    vacancy: "AI Algorithm Lead",
    companyName: "Google",
    companyInitials: "GO",
    waitingTime: "26h 05m",
    hours: 26.08,
    status: "critical"
  },
  // Extra pages for interactive pagination
  {
    id: "r5",
    name: "Adriana Pérez",
    role: "Backend Engineer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    vacancy: "NodeJS Architect",
    companyName: "Mercado Libre",
    companyInitials: "ML",
    waitingTime: "30h 10m",
    hours: 30.17,
    status: "critical"
  },
  {
    id: "r6",
    name: "Carlos Mendoza",
    role: "Frontend Dev",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    vacancy: "Next.js Specialist",
    companyName: "Vercel",
    companyInitials: "VC",
    waitingTime: "15h 25m",
    hours: 15.42,
    status: "observation"
  },
  {
    id: "r7",
    name: "Isabella Martinez",
    role: "Data Analyst",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
    vacancy: "BI Developer",
    companyName: "PowerCorp",
    companyInitials: "PC",
    waitingTime: "02h 55m",
    hours: 2.92,
    status: "normal"
  },
  {
    id: "r8",
    name: "David Silva",
    role: "Security Engineer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    vacancy: "CISO Assistant",
    companyName: "CyberSafe",
    companyInitials: "CS",
    waitingTime: "29h 40m",
    hours: 29.67,
    status: "critical"
  }
];

export function SlaMonitor() {
  const [requests, setRequests] = React.useState<SlaRequest[]>(initialRequests);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<"all" | "critical" | "observation" | "normal">("all");

  const itemsPerPage = 4;

  const handleSpeedUp = (name: string) => {
    toast.success(`Prioridad SLA acelerada para ${name}`, {
      description: "Se notificó de inmediato a los gestores de cuenta y se asignó canal prioritario.",
    });
  };

  const handleExport = () => {
    toast.info("Generando reporte de SLAs en tiempo real...");
    setTimeout(() => {
      toast.success("¡Reporte Exportado!", {
        description: "El documento CSV ha sido descargado en su máquina.",
      });
    }, 1500);
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.vacancy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: "critical" | "observation" | "normal") => {
    switch (status) {
      case "critical":
        return <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full">Retraso Crítico</Badge>;
      case "observation":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full">Observación</Badge>;
      case "normal":
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-full">Normal</Badge>;
    }
  };

  const getStatusIndicatorColor = (status: "critical" | "observation" | "normal") => {
    switch (status) {
      case "critical":
        return "bg-rose-500";
      case "observation":
        return "bg-amber-500";
      case "normal":
        return "bg-emerald-500";
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Search Header for Mobile/Global */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-border/20 pb-4">
        <div className="flex items-center bg-white/70 dark:bg-zinc-900/40 px-4 py-2.5 rounded-full border border-border/40 w-full md:w-80 shadow-xs">
          <Search className="text-muted-foreground w-5 h-5 mr-2 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent border-none outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground w-full p-0"
            placeholder="Buscar cuentas o vacantes..."
          />
        </div>
        
        <div className="flex gap-2">
          {(["all", "normal", "observation", "critical"] as const).map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? "default" : "outline"}
              onClick={() => {
                setStatusFilter(filter);
                setCurrentPage(1);
              }}
              className="h-9 px-4 rounded-full text-[11.5px] font-bold tracking-tight shrink-0 cursor-pointer"
            >
              {filter === "all" ? "Todos" : filter === "normal" ? "Normal (<12h)" : filter === "observation" ? "Observación" : "Crítico (>24h)"}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Stats (Bento Style) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active Requests */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Solicitudes Activas</p>
          <p className="text-[48px] font-bold text-primary tracking-tight leading-none">124</p>
        </Card>

        {/* Normal */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Normal (&lt;12h)</p>
          <p className="text-[48px] font-bold text-muted-foreground/60 dark:text-muted-foreground/40 tracking-tight leading-none">82</p>
        </Card>

        {/* Observation */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">En Observación</p>
          <p className="text-[48px] font-bold text-amber-500 tracking-tight leading-none">31</p>
        </Card>

        {/* Critical */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Crítico (&gt;24h)</p>
          <p className="text-[48px] font-bold text-rose-500 tracking-tight leading-none">11</p>
        </Card>

      </section>

      {/* Processing Table Card */}
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-sm">
        
        {/* Table Header Controls */}
        <div className="p-8 border-b border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 dark:bg-zinc-900/10">
          <div className="flex flex-col gap-1">
            <h3 className="text-[20px] font-bold text-foreground tracking-tight">Cola de Procesamiento</h3>
            <p className="text-[12px] text-muted-foreground">Listado de SLAs de validación activa</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none h-10 px-5 rounded-full border-border text-[12px] font-bold flex items-center gap-2 cursor-pointer">
              <Filter className="h-4 w-4" /> 
              Filtrar
            </Button>
            <Button 
              onClick={handleExport}
              className="flex-1 sm:flex-none h-10 px-6 rounded-full bg-primary text-primary-foreground text-[12px] font-bold shadow-md shadow-primary/10 hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" /> 
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[11px] font-bold text-muted-foreground/75 uppercase tracking-wider border-b border-border/20 bg-zinc-50/30 dark:bg-zinc-950/10">
                <th className="py-5 px-8">Profesional</th>
                <th className="py-5 px-4">Vacante</th>
                <th className="py-5 px-4">Empresa</th>
                <th className="py-5 px-4">Tiempo de Espera</th>
                <th className="py-5 px-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground font-medium">
                    No hay solicitudes activas para mostrar.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors relative"
                  >
                    
                    {/* SLA Priority Color Indicator Bar */}
                    <td className="py-6 px-8 relative">
                      <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${getStatusIndicatorColor(req.status)}`} />
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs flex-shrink-0">
                          <AvatarImage src={req.avatar} className="object-cover" />
                          <AvatarFallback>{req.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{req.name}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{req.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Vacancy */}
                    <td className="py-6 px-4 text-[13.5px] text-foreground font-semibold truncate max-w-[200px]">
                      {req.vacancy}
                    </td>

                    {/* Company */}
                    <td className="py-6 px-4 max-w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-extrabold text-[10px] text-primary shadow-xs border border-border/40 shrink-0">
                          {req.companyInitials}
                        </div>
                        <span className="text-[13.5px] text-muted-foreground font-semibold truncate">{req.companyName}</span>
                      </div>
                    </td>

                    {/* SLA Counter / Waiting Time */}
                    <td className="py-6 px-4">
                      <div className="flex flex-col">
                        <span className={`text-[18px] font-black tracking-tight ${
                          req.status === "critical"
                            ? "text-rose-500"
                            : req.status === "observation"
                              ? "text-amber-500"
                              : "text-muted-foreground"
                        }`}>
                          {req.waitingTime}
                        </span>
                        <div className="mt-1 flex items-center">
                          {getStatusBadge(req.status)}
                        </div>
                      </div>
                    </td>

                    {/* Admin Action triggers */}
                    <td className="py-6 px-8 text-right whitespace-nowrap">
                      <Button
                        onClick={() => handleSpeedUp(req.name)}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer"
                        title="Acelerar SLA (Prioritario)"
                      >
                        <Bolt className="h-5 w-5 fill-primary/10" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted/80 shrink-0 cursor-pointer"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40 dark:bg-zinc-900/10">
          <p className="text-[13px] text-muted-foreground font-medium">
            Mostrando {paginatedRequests.length} de {filteredRequests.length} solicitudes
          </p>
          <div className="flex items-center gap-2">
            
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full cursor-pointer border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              const isActive = currentPage === page;
              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={isActive ? "default" : "outline"}
                  className={`w-10 h-10 p-0 rounded-full text-[13px] font-bold cursor-pointer border-border ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" : ""
                  }`}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-10 h-10 rounded-full cursor-pointer border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

          </div>
        </div>

      </Card>

      {/* Ambient Particle visual decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[600px] h-[600px] bg-secondary/15 blur-[150px] rounded-full"></div>
      </div>

    </div>
  );
}
