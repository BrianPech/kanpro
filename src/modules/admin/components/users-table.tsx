"use client";

import * as React from "react";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  Ban, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  Briefcase,
  Building2,
  Filter,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "company" | "candidate";
  status: "active" | "inactive" | "suspended";
  joinedAt: string;
  avatar: string | null;
}

const roleLabels: Record<string, string> = {
  company: "Empresa",
  candidate: "Candidato",
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  inactive: "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border border-border/50",
  suspended: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
};

export function UsersTable() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<"all" | "company" | "candidate">("all");
  const [selectedStatus, setSelectedStatus] = React.useState<"all" | "active" | "inactive" | "suspended">("all");

  React.useEffect(() => {
    import("../data/mock").then((mod) => setUsers(mod.recentUsers as User[]));
  }, []);

  const handleVerify = (id: string, name: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "active" as const } : u))
    );
    toast.success(`Cuenta de ${name} verificada con éxito`, {
      description: "El usuario ahora tiene acceso completo a la plataforma.",
    });
  };

  const handleWarn = (name: string) => {
    toast.warning(`Advertencia enviada a ${name}`, {
      description: "Se ha enviado un correo formal solicitando la revisión de su actividad.",
    });
  };

  const handleSuspend = (id: string, name: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "suspended" as const } : u))
    );
    toast.error(`Cuenta de ${name} suspendida`, {
      description: "El acceso a la plataforma ha sido revocado temporalmente.",
    });
  };

  const handleCreateMockUser = () => {
    const newUser: User = {
      id: String(users.length + 1),
      name: "Sofía Arriaga",
      email: "sofia.arriaga@email.com",
      role: "candidate" as const,
      status: "active" as const,
      joinedAt: new Date().toISOString().split("T")[0],
      avatar: null,
    };
    setUsers((prev) => [newUser, ...prev]);
    toast.success("Nuevo candidato registrado", {
      description: "Sofía Arriaga ha sido creada localmente con rol Candidato.",
    });
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "company":
        return <Badge className="bg-[#007bc2]/10 hover:bg-[#007bc2]/10 text-[#007bc2] border-none text-[11px] font-bold px-3 py-0.5 rounded-full">Empresa</Badge>;
      case "candidate":
        return <Badge className="bg-[#00a87e]/10 hover:bg-[#00a87e]/10 text-[#00a87e] border-none text-[11px] font-bold px-3 py-0.5 rounded-full">Candidato</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Dynamic Summary Stats for Users */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Users */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Usuarios Registrados</p>
          <div className="flex items-center gap-3">
            <p className="text-[48px] font-bold text-primary tracking-tight leading-none">2.8K</p>
            <span className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 mt-1">
              <UsersIcon className="h-5 w-5" />
            </span>
          </div>
        </Card>

        {/* Companies */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Empresas</p>
          <div className="flex items-center gap-3">
            <p className="text-[48px] font-bold text-[#007bc2] tracking-tight leading-none">156</p>
            <span className="p-2 bg-[#007bc2]/10 text-[#007bc2] rounded-xl shrink-0 mt-1">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
        </Card>

        {/* Candidates */}
        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-2 shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          <p className="text-[14px] font-medium text-muted-foreground">Candidatos</p>
          <div className="flex items-center gap-3">
            <p className="text-[48px] font-bold text-[#00a87e] tracking-tight leading-none">1.2K</p>
            <span className="p-2 bg-[#00a87e]/10 text-[#00a87e] rounded-xl shrink-0 mt-1">
              <UserCheck className="h-5 w-5" />
            </span>
          </div>
        </Card>

      </section>

      {/* Double Filter Bar */}
      <div className="flex flex-col gap-4 border-b border-border/20 pb-6 bg-transparent">
        
        {/* Row 1: Search & Create */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center bg-white/70 dark:bg-zinc-900/40 px-4 py-2.5 rounded-full border border-border/40 w-full sm:w-80 shadow-xs">
            <Search className="text-muted-foreground w-5 h-5 mr-2 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13.5px] text-foreground placeholder:text-muted-foreground w-full p-0"
              placeholder="Buscar por nombre o correo..."
            />
          </div>

          <Button 
            onClick={handleCreateMockUser}
            className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-[12px] font-bold shadow-md shadow-primary/10 hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" /> 
            Registrar Usuario
          </Button>
        </div>

        {/* Row 2: Tabs Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mt-2">
          
          {/* Roles Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedRole === "all" ? "default" : "outline"}
              onClick={() => setSelectedRole("all")}
              className="h-9 px-4 rounded-full text-[11px] font-bold tracking-tight cursor-pointer"
            >
              Todos los Roles
            </Button>
            <Button
              variant={selectedRole === "company" ? "default" : "outline"}
              onClick={() => setSelectedRole("company")}
              className="h-9 px-4 rounded-full text-[11px] font-bold tracking-tight cursor-pointer border-[#007bc2]/20 text-[#007bc2] hover:bg-[#007bc2]/5 data-[variant=default]:bg-[#007bc2] data-[variant=default]:text-white"
            >
              Empresas
            </Button>
            <Button
              variant={selectedRole === "candidate" ? "default" : "outline"}
              onClick={() => setSelectedRole("candidate")}
              className="h-9 px-4 rounded-full text-[11px] font-bold tracking-tight cursor-pointer border-[#00a87e]/20 text-[#00a87e] hover:bg-[#00a87e]/5 data-[variant=default]:bg-[#00a87e] data-[variant=default]:text-white"
            >
              Candidatos
            </Button>
          </div>

          {/* Status Filter tabs */}
          <div className="flex gap-2 flex-wrap md:ml-auto">
            {(["all", "active", "inactive", "suspended"] as const).map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status)}
                className="h-8 px-3.5 rounded-full text-[10.5px] font-bold tracking-tight cursor-pointer"
              >
                {status === "all" ? "Todos los Estados" : status === "active" ? "Activos" : status === "inactive" ? "Inactivos" : "Suspendidos"}
              </Button>
            ))}
          </div>

        </div>

      </div>

      {/* Main Table Card container */}
      <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-[11px] font-bold text-muted-foreground/75 uppercase tracking-wider border-b border-border/20 bg-zinc-50/30 dark:bg-zinc-950/10">
                <th className="py-5 px-8">Usuario</th>
                <th className="py-5 px-4">Rol</th>
                <th className="py-5 px-4">Estado</th>
                <th className="py-5 px-4">Fecha de Registro</th>
                <th className="py-5 px-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground font-medium">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors relative"
                  >
                    
                    {/* User profile detail */}
                    <td className="py-6 px-8 relative">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 rounded-full border border-border/40 shadow-xs shrink-0 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-[13px] font-extrabold">
                          <AvatarFallback className="bg-transparent text-primary-foreground font-extrabold">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-foreground truncate">{user.name}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-6 px-4">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status badge */}
                    <td className="py-6 px-4">
                      <span className={`text-[11.5px] font-bold px-3 py-1 rounded-full ${statusStyles[user.status]}`}>
                        {user.status === "active"
                          ? "Activo"
                          : user.status === "inactive"
                            ? "Inactivo"
                            : "Suspendido"}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-6 px-4 text-[13px] text-muted-foreground font-semibold">
                      {new Date(user.joinedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action dropdown */}
                    <td className="py-6 px-8 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] rounded-[16px] p-2 shadow-md">
                          
                          <DropdownMenuItem 
                            onClick={() => handleVerify(user.id, user.name)}
                            disabled={user.status === "active"}
                            className="rounded-[10px] h-[38px] text-[13px] font-semibold cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-3 text-emerald-500" />
                            Verificar cuenta
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleWarn(user.name)}
                            className="rounded-[10px] h-[38px] text-[13px] font-semibold cursor-pointer"
                          >
                            <AlertTriangle className="h-4 w-4 mr-3 text-amber-500" />
                            Enviar advertencia
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1" />

                          <DropdownMenuItem 
                            onClick={() => handleSuspend(user.id, user.name)}
                            disabled={user.status === "suspended"}
                            className="rounded-[10px] h-[38px] text-[13px] font-semibold text-rose-500 focus:text-rose-500 cursor-pointer"
                          >
                            <Ban className="h-4 w-4 mr-3 text-rose-500" />
                            Suspender cuenta
                          </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-6 border-t border-border/20 bg-zinc-50/30 dark:bg-zinc-950/10 flex justify-between items-center">
          <p className="text-[13px] text-muted-foreground font-medium">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </p>
        </div>

      </Card>

    </div>
  );
}
