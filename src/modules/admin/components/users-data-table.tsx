"use client";

import * as React from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";

import { startImpersonating } from "@/lib/auth/impersonation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CircleCheck,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Building2,
  User as UserIcon,
  Mail,
  Search,
  Sparkles,
  UserX,
  UserCheck,
  Download,
  ArrowUpDown,
  Loader2,
  Clock,
} from "@/components/ui/icons";
import {
  updateUserRole,
  toggleUserStatus,
  updateUserProfile,
} from "@/app/(dashboard)/dashboard/admin/users/actions";
import { cn } from "@/lib/utils";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "candidate", "company"]),
  status: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
});

export type UserItem = z.infer<typeof userSchema>;

function getInitials(name: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface UsersDataTableProps {
  data: UserItem[];
}

export function UsersDataTable({ data: initialData }: UsersDataTableProps) {
  const [data, setData] = React.useState<UserItem[]>(initialData);
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Action Modals State
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);
  const [roleModalUser, setRoleModalUser] = React.useState<UserItem | null>(null);
  const [newSelectedRole, setNewSelectedRole] = React.useState<"admin" | "candidate" | "company">("candidate");
  const [isUpdatingRole, setIsUpdatingRole] = React.useState(false);

  const [statusDialogUser, setStatusDialogUser] = React.useState<UserItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerUser, setDrawerUser] = React.useState<UserItem | null>(null);
  const [drawerName, setDrawerName] = React.useState("");
  const [drawerRole, setDrawerRole] = React.useState<"admin" | "candidate" | "company">("candidate");
  const [isSavingDrawer, setIsSavingDrawer] = React.useState(false);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Handle Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      await updateUserRole(roleModalUser.id, newSelectedRole);
      setData((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: newSelectedRole } : u))
      );
      toast.success(`Rol de ${roleModalUser.name} actualizado a ${newSelectedRole === "admin" ? "Administrador" : newSelectedRole === "company" ? "Empresa" : "Candidato"}`);
      setRoleModalUser(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al actualizar rol");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Status Toggle (Suspend / Activate)
  const handleConfirmStatusToggle = async () => {
    if (!statusDialogUser) return;
    setIsUpdatingStatus(true);
    const targetStatus = statusDialogUser.status === "Activo" ? "suspended" : "active";
    try {
      await toggleUserStatus(statusDialogUser.id, targetStatus);
      setData((prev) =>
        prev.map((u) =>
          u.id === statusDialogUser.id
            ? { ...u, status: targetStatus === "suspended" ? "Suspendido" : "Activo" }
            : u
        )
      );
      toast.success(
        targetStatus === "suspended"
          ? `Acceso de ${statusDialogUser.name} suspendido correctamente.`
          : `Cuenta de ${statusDialogUser.name} reactivada.`
      );
      setStatusDialogUser(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al cambiar estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Drawer Save
  const handleSaveDrawer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerUser) return;
    setIsSavingDrawer(true);
    try {
      await updateUserProfile(drawerUser.id, {
        fullName: drawerName,
        role: drawerRole,
      });
      setData((prev) =>
        prev.map((u) =>
          u.id === drawerUser.id
            ? { ...u, name: drawerName, role: drawerRole }
            : u
        )
      );
      toast.success("Perfil de usuario actualizado exitosamente");
      setDrawerOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al guardar cambios");
    } finally {
      setIsSavingDrawer(false);
    }
  };

  const openDrawerForUser = (user: UserItem) => {
    setDrawerUser(user);
    setDrawerName(user.name);
    setDrawerRole(user.role);
    setDrawerOpen(true);
  };

  const columns = React.useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <span>Usuario</span>
            <ArrowUpDown className="size-3 ml-1" />
          </Button>
        ),
        cell: ({ row }) => {
          const user = row.original;
          const initials = getInitials(user.name);
          return (
            <div
              onClick={() => openDrawerForUser(user)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Avatar className="size-10 rounded-2xl border border-border/60 bg-muted shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {user.name}
                  </span>
                  {user.role === "admin" && (
                    <ShieldCheck className="size-3.5 text-purple-500 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 truncate font-mono">
                  <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                  {user.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Rol de Cuenta",
        cell: ({ row }) => {
          const role = row.original.role;
          if (role === "admin") {
            return (
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1.5 border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400"
              >
                <ShieldCheck className="size-3" />
                <span>Administrador</span>
              </Badge>
            );
          }
          if (role === "company") {
            return (
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1.5 border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Building2 className="size-3" />
                <span>Empresa</span>
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1.5 border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              <UserIcon className="size-3" />
              <span>Candidato</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "Suspendido" || status === "suspended") {
            return (
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-bold border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1.5 rounded-xl"
              >
                <UserX className="size-3" />
                <span>Suspendido</span>
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-bold border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-xl"
            >
              <CircleCheck className="size-3" />
              <span>Activo</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-right">Fecha Registro</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs font-medium text-muted-foreground">
            {row.original.createdAt}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    toast.loading(`Iniciando impersonación de ${user.name}...`);
                    const res = await startImpersonating(user.id);
                    toast.success(`Impersonando a ${res.targetName}`);
                    window.location.href = res.redirectUrl;
                  } catch (err: unknown) {
                    toast.error((err as Error).message || "Error al impersonar.");
                  }
                }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 text-purple-600 hover:bg-purple-500/10 cursor-pointer border-purple-500/20"
              >
                <Sparkles className="size-3" />
                <span>Impersonar</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-border/60">
                  <DropdownMenuItem
                    className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2"
                    onClick={() => openDrawerForUser(user)}
                  >
                    <UserCheck className="size-4 text-primary" />
                    <span>Ver Detalle & Editar</span>
                  </DropdownMenuItem>

                  {user.role === "company" && (
                    <DropdownMenuItem
                      className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2 text-primary"
                      render={<Link href={`/dashboard/admin/companies/${user.id}`} />}
                    >
                      <Building2 className="size-4 text-primary" />
                      <span>Ver Ficha 360°</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2"
                    onClick={() => {
                      setRoleModalUser(user);
                      setNewSelectedRole(user.role);
                    }}
                  >
                    <ShieldCheck className="size-4 text-purple-600" />
                    <span>Cambiar Rol de Cuenta</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  {user.status === "Suspendido" ? (
                    <DropdownMenuItem
                      className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2 text-emerald-600"
                      onClick={() => setStatusDialogUser(user)}
                    >
                      <CircleCheck className="size-4" />
                      <span>Reactivar Usuario</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2 text-rose-600"
                      onClick={() => setStatusDialogUser(user)}
                    >
                      <UserX className="size-4" />
                      <span>Suspender Acceso</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      if (activeTab !== "all" && item.role !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [data, activeTab, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExportCSV = () => {
    const headers = ["Nombre", "Email", "Rol", "Estado", "Fecha Registro"];
    const rows = filteredData.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.createdAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios_kanpro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Listado de usuarios exportado en CSV");
  };

  const roleCounts = React.useMemo(() => {
    return {
      all: data.length,
      candidate: data.filter((u) => u.role === "candidate").length,
      company: data.filter((u) => u.role === "company").length,
      admin: data.filter((u) => u.role === "admin").length,
    };
  }, [data]);

  return (
    <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar por nombre o correo electrónico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 h-10 rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm font-medium focus-visible:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-10 px-3.5 rounded-2xl border-border/60 text-xs font-bold gap-1.5 hover:bg-muted cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Exportar</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 rounded-2xl border-border/60 text-xs font-bold gap-1.5 hover:bg-muted cursor-pointer"
                  />
                }
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">Columnas</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5 border-border/60">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs font-medium rounded-xl py-1.5"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === "name"
                        ? "Usuario"
                        : column.id === "role"
                        ? "Rol"
                        : column.id === "status"
                        ? "Estado"
                        : column.id === "createdAt"
                        ? "Fecha Registro"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { key: "all", label: "Todos los Usuarios", count: roleCounts.all },
            { key: "candidate", label: "Candidatos", count: roleCounts.candidate },
            { key: "company", label: "Empresas", count: roleCounts.company },
            { key: "admin", label: "Administradores", count: roleCounts.admin },
          ].map((pill) => {
            const isActive = activeTab === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => {
                  setActiveTab(pill.key);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border",
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-2xs"
                    : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{pill.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold",
                    isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  )}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-muted/30 border-b border-border/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-3.5 px-4 sm:px-6 font-extrabold text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserIcon className="size-8 stroke-[1.4] text-muted-foreground/50" />
                    <p className="text-sm font-bold text-foreground">No se encontraron usuarios</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      No hay registros que coincidan con la búsqueda o filtro seleccionado.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 px-4 sm:px-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{" "}
            <strong>{Math.max(1, table.getPageCount())}</strong>
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span>
            Mostrando {table.getRowModel().rows.length} de {filteredData.length} usuarios
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="size-8 rounded-lg border-border/60 cursor-pointer"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="size-8 rounded-lg border-border/60 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="size-8 rounded-lg border-border/60 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="size-8 rounded-lg border-border/60 cursor-pointer"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Change Role Modal */}
      <Dialog open={!!roleModalUser} onOpenChange={(open) => !open && setRoleModalUser(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-border/60 shadow-2xl">
          <DialogHeader className="gap-1.5 pb-2">
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-5 text-purple-600" />
              <span>Cambiar Rol de Usuario</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifique los privilegios asignados para <strong className="text-foreground">{roleModalUser?.name}</strong> ({roleModalUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seleccionar Nuevo Rol
            </Label>
            <Select
              value={newSelectedRole}
              onValueChange={(val) => val && setNewSelectedRole(val as any)}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl bg-muted/30 border-border/60 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/60">
                <SelectGroup>
                  <SelectItem value="candidate" className="text-xs py-2 font-bold cursor-pointer">
                    Candidato (Buscador de Empleo)
                  </SelectItem>
                  <SelectItem value="company" className="text-xs py-2 font-bold cursor-pointer">
                    Empresa (Reclutador / Publicador)
                  </SelectItem>
                  <SelectItem value="admin" className="text-xs py-2 font-bold cursor-pointer text-purple-600">
                    Administrador (Acceso Total al Panel)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleModalUser(null)}
              disabled={isUpdatingRole}
              className="h-10 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRoleChange}
              disabled={isUpdatingRole}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              {isUpdatingRole ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>Guardar Nuevo Rol</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend / Reactivate Confirmation Dialog */}
      <AlertDialog open={!!statusDialogUser} onOpenChange={(open) => !open && setStatusDialogUser(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md p-6 border-border/60 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <UserX className="size-5 text-rose-600" />
              <span>
                {statusDialogUser?.status === "Activo"
                  ? "Suspender Acceso de Usuario"
                  : "Reactivar Cuenta de Usuario"}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
              {statusDialogUser?.status === "Activo" ? (
                <>
                  ¿Está seguro de suspender el acceso de <strong className="text-foreground">{statusDialogUser?.name}</strong>? El usuario no podrá iniciar sesión en la plataforma hasta ser reactivado.
                </>
              ) : (
                <>
                  ¿Desea reactivar la cuenta de <strong className="text-foreground">{statusDialogUser?.name}</strong> para que vuelva a tener acceso normal a la plataforma?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel disabled={isUpdatingStatus} className="h-10 rounded-xl text-xs font-bold cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusToggle}
              disabled={isUpdatingStatus}
              className={cn(
                "h-10 rounded-xl text-xs font-bold cursor-pointer shadow-xs",
                statusDialogUser?.status === "Activo"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              {isUpdatingStatus ? "Procesando..." : statusDialogUser?.status === "Activo" ? "Confirmar Suspensión" : "Reactivar Cuenta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-6 max-w-lg mx-auto rounded-t-3xl border-border/60 bg-card">
          <DrawerHeader className="p-0 pb-4 text-left">
            <DrawerTitle className="text-lg font-extrabold text-foreground">
              Ficha del Usuario: {drawerUser?.name}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              ID: {drawerUser?.id} • Registrado el {drawerUser?.createdAt}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSaveDrawer} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nombre Completo
              </Label>
              <Input
                value={drawerName}
                onChange={(e) => setDrawerName(e.target.value)}
                required
                className="h-10 rounded-xl bg-muted/30 border-border/60 text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Correo Electrónico
              </Label>
              <Input
                value={drawerUser?.email}
                disabled
                className="h-10 rounded-xl bg-muted/20 border-border/40 text-xs sm:text-sm font-mono text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rol en la Plataforma
              </Label>
              <Select
                value={drawerRole}
                onValueChange={(val) => val && setDrawerRole(val as any)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/30 border-border/60 text-xs sm:text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/60">
                  <SelectGroup>
                    <SelectItem value="candidate" className="text-xs py-2 font-bold">Candidato</SelectItem>
                    <SelectItem value="company" className="text-xs py-2 font-bold">Empresa</SelectItem>
                    <SelectItem value="admin" className="text-xs py-2 font-bold text-purple-600">Administrador</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DrawerFooter className="p-0 pt-4 flex flex-row items-center justify-end gap-2">
              <DrawerClose render={<Button variant="outline" className="h-10 rounded-xl text-xs font-bold cursor-pointer" />}>
                Cancelar
              </DrawerClose>
              <Button
                type="submit"
                disabled={isSavingDrawer}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                {isSavingDrawer ? <Loader2 className="size-3.5 animate-spin" /> : <CircleCheck className="size-4" />}
                <span>Guardar Cambios</span>
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

    </Card>
  );
}
