"use client";

import * as React from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";
import { startImpersonating } from "@/lib/auth/impersonation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  Loader2,
  MoreVertical,
  Search,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  UserCheck,
  UserX,
  X,
} from "@/components/ui/icons";
import {
  updateUserRole,
  toggleUserStatus,
  updateUserProfile,
} from "@/app/(dashboard)/dashboard/admin/users/actions";
import { cn } from "@/lib/utils";

export const accountSegmentSchema = z.enum([
  "owner",
  "candidate",
  "employee",
  "admin",
]);

export type AccountSegment = z.infer<typeof accountSegmentSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "candidate", "company"]),
  segment: accountSegmentSchema,
  status: z.enum(["Activo", "Suspendido", "Inactivo"]),
  isVerified: z.boolean(),
  contextTitle: z.string(),
  contextSubtitle: z.string(),
  companyId: z.string().optional(),
  avatar: z.string().optional(),
  createdAt: z.string(),
});

export type UserItem = z.infer<typeof userSchema>;

type SegmentFilter = "all" | AccountSegment;
type StatusFilter = "all" | "Activo" | "Suspendido" | "Inactivo";
type VerificationFilter = "all" | "verified" | "unverified";

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const ROW_HEIGHT_PX = 54;
const HEADER_HEIGHT_PX = 36;

const SEGMENT_META: Record<
  AccountSegment,
  { label: string; variant: "outline" | "secondary" }
> = {
  owner: { label: "Dueño de empresa", variant: "outline" },
  employee: { label: "Empleado", variant: "outline" },
  candidate: { label: "Candidato", variant: "outline" },
  admin: { label: "Staff Admin", variant: "secondary" },
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Estado: Todos",
  Activo: "Activos",
  Suspendido: "Suspendidos",
  Inactivo: "Inactivos",
};

const VERIFICATION_FILTER_LABELS: Record<VerificationFilter, string> = {
  all: "Sello: Todos",
  verified: "Verificados",
  unverified: "Sin verificar",
};

const ROLE_LABELS: Record<"admin" | "candidate" | "company", string> = {
  candidate: "Candidato / Empleado",
  company: "Dueño de empresa",
  admin: "Staff Administrador",
};

function getInitials(name: string): string {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

interface UsersDataTableProps {
  data: UserItem[];
}

export function UsersDataTable({ data: initialData }: UsersDataTableProps) {
  const [data, setData] = React.useState<UserItem[]>(initialData);
  const [segmentFilter, setSegmentFilter] = React.useState<SegmentFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [verificationFilter, setVerificationFilter] =
    React.useState<VerificationFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Modales y Drawer
  const [roleModalUser, setRoleModalUser] = React.useState<UserItem | null>(
    null
  );
  const [newSelectedRole, setNewSelectedRole] = React.useState<
    "admin" | "candidate" | "company"
  >("candidate");
  const [isUpdatingRole, setIsUpdatingRole] = React.useState(false);

  const [statusDialogUser, setStatusDialogUser] =
    React.useState<UserItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerUser, setDrawerUser] = React.useState<UserItem | null>(null);
  const [drawerName, setDrawerName] = React.useState("");
  const [drawerRole, setDrawerRole] = React.useState<
    "admin" | "candidate" | "company"
  >("candidate");
  const [isSavingDrawer, setIsSavingDrawer] = React.useState(false);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const openDrawerForUser = React.useCallback((user: UserItem) => {
    setDrawerUser(user);
    setDrawerName(user.name);
    setDrawerRole(user.role);
    setDrawerOpen(true);
  }, []);

  const mapRoleToSegment = (
    role: "admin" | "candidate" | "company",
    currentSegment: AccountSegment
  ): AccountSegment => {
    if (role === "admin") return "admin";
    if (role === "company") return "owner";
    return currentSegment === "employee" ? "employee" : "candidate";
  };

  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    try {
      await updateUserRole(roleModalUser.id, newSelectedRole);
      setData((prev) =>
        prev.map((u) =>
          u.id === roleModalUser.id
            ? {
                ...u,
                role: newSelectedRole,
                segment: mapRoleToSegment(newSelectedRole, u.segment),
              }
            : u
        )
      );
      toast.success(
        `Rol de ${roleModalUser.name} actualizado a ${
          newSelectedRole === "admin"
            ? "Staff Admin"
            : newSelectedRole === "company"
              ? "Dueño de empresa"
              : "Candidato"
        }`
      );
      setRoleModalUser(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al actualizar rol"));
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusDialogUser) return;
    setIsUpdatingStatus(true);
    const targetStatus =
      statusDialogUser.status === "Activo" ? "suspended" : "active";
    try {
      await toggleUserStatus(statusDialogUser.id, targetStatus);
      setData((prev) =>
        prev.map((u) =>
          u.id === statusDialogUser.id
            ? {
                ...u,
                status: targetStatus === "suspended" ? "Suspendido" : "Activo",
              }
            : u
        )
      );
      toast.success(
        targetStatus === "suspended"
          ? `Acceso de ${statusDialogUser.name} suspendido.`
          : `Cuenta de ${statusDialogUser.name} reactivada.`
      );
      setStatusDialogUser(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al cambiar estado"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
            ? {
                ...u,
                name: drawerName,
                role: drawerRole,
                segment: mapRoleToSegment(drawerRole, u.segment),
              }
            : u
        )
      );
      toast.success("Perfil de usuario actualizado");
      setDrawerOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al guardar cambios"));
    } finally {
      setIsSavingDrawer(false);
    }
  };

  const columns = React.useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>Usuario</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => {
          const user = row.original;
          const initials = getInitials(user.name);
          return (
            <button
              type="button"
              onClick={() => openDrawerForUser(user)}
              className="flex items-center gap-2.5 min-w-0 w-full text-left cursor-pointer group"
            >
              <Avatar className="size-[30px] rounded-[8px] shrink-0 after:hidden">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  className="rounded-[8px] object-cover"
                />
                <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[11px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate group-hover:text-link transition-colors">
                    {user.name}
                  </span>
                  {user.isVerified && (
                    <ShieldCheck className="size-3.5 text-success-foreground shrink-0" />
                  )}
                </div>
                <span className="text-[11.5px] text-muted-foreground block truncate">
                  {user.email}
                </span>
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: "segment",
        header: "Tipo de cuenta",
        cell: ({ row }) => {
          const meta = SEGMENT_META[row.original.segment];
          return (
            <Badge
              variant={meta.variant}
              className="rounded-[6px] px-2 py-0.5 text-[11px] font-medium"
            >
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "contextTitle",
        header: "Organización / contexto",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-foreground truncate">
                {user.contextTitle}
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate">
                {user.contextSubtitle}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          const colorClass =
            status === "Suspendido"
              ? "text-destructive"
              : status === "Inactivo"
                ? "text-muted-foreground"
                : "text-success-foreground";
          return (
            <span
              className={cn(
                "text-[12px] font-semibold whitespace-nowrap",
                colorClass
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Registro",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted-foreground tabular-nums whitespace-nowrap">
            {row.original.createdAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {user.segment === "owner" && user.companyId && (
                <Link
                  href={`/dashboard/admin/companies/${user.companyId}`}
                  className="text-[12px] font-medium text-link hover:underline whitespace-nowrap"
                >
                  360° →
                </Link>
              )}
              {user.segment === "admin" && (
                <Link
                  href="/dashboard/admin/staff"
                  className="text-[12px] font-medium text-link hover:underline whitespace-nowrap"
                >
                  Staff →
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Acciones para ${user.name}`}
                      className="size-7 rounded-[8px] text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-[12px] p-1 border-border bg-card shadow-lg"
                >
                  <DropdownMenuItem
                    className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px]"
                    onClick={() => openDrawerForUser(user)}
                  >
                    <UserCheck className="size-3.5 text-muted-foreground" />
                    <span>Ver y editar</span>
                  </DropdownMenuItem>

                  {user.segment === "owner" && user.companyId && (
                    <DropdownMenuItem
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px]"
                      render={
                        <Link
                          href={`/dashboard/admin/companies/${user.companyId}`}
                        />
                      }
                    >
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <span>Ficha 360° empresa</span>
                    </DropdownMenuItem>
                  )}

                  {user.role !== "admin" && (
                    <DropdownMenuItem
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px]"
                      onClick={async () => {
                        try {
                          toast.loading(`Impersonando a ${user.name}...`);
                          const res = await startImpersonating(user.id);
                          toast.success(`Sesión iniciada como ${res.targetName}`);
                          window.location.href = res.redirectUrl;
                        } catch (err: unknown) {
                          toast.error(
                            getErrorMessage(err, "Error al impersonar")
                          );
                        }
                      }}
                    >
                      <Sparkles className="size-3.5 text-muted-foreground" />
                      <span>Impersonar cuenta</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px]"
                    onClick={() => {
                      setRoleModalUser(user);
                      setNewSelectedRole(user.role);
                    }}
                  >
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <span>Cambiar rol</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  {user.status === "Suspendido" ? (
                    <DropdownMenuItem
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px] text-success-foreground"
                      onClick={() => setStatusDialogUser(user)}
                    >
                      <CircleCheck className="size-3.5" />
                      <span>Reactivar cuenta</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      variant="destructive"
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px] text-destructive"
                      onClick={() => setStatusDialogUser(user)}
                    >
                      <UserX className="size-3.5" />
                      <span>Suspender acceso</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [openDrawerForUser]
  );

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      if (segmentFilter !== "all" && item.segment !== segmentFilter) {
        return false;
      }
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (verificationFilter === "verified" && !item.isVerified) {
        return false;
      }
      if (verificationFilter === "unverified" && item.isVerified) {
        return false;
      }
      if (q) {
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.contextTitle.toLowerCase().includes(q) ||
          item.contextSubtitle.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [data, segmentFilter, statusFilter, verificationFilter, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExportCSV = () => {
    const headers = [
      "Nombre",
      "Email",
      "Tipo",
      "Organizacion/Contexto",
      "Estado",
      "Verificado",
      "Registro",
    ];
    const rows = filteredData.map((u) => [
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${SEGMENT_META[u.segment].label}"`,
      `"${u.contextTitle.replace(/"/g, '""')}"`,
      `"${u.status}"`,
      `"${u.isVerified ? "Si" : "No"}"`,
      `"${u.createdAt}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios_kanpro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Listado exportado a CSV");
  };

  const segmentCounts = React.useMemo(
    () => ({
      all: data.length,
      owner: data.filter((u) => u.segment === "owner").length,
      candidate: data.filter((u) => u.segment === "candidate").length,
      employee: data.filter((u) => u.segment === "employee").length,
      admin: data.filter((u) => u.segment === "admin").length,
    }),
    [data]
  );

  const segmentTabs: Array<{ id: SegmentFilter; label: string; count: number }> =
    [
      { id: "all", label: "Todos", count: segmentCounts.all },
      { id: "owner", label: "Dueños de empresa", count: segmentCounts.owner },
      { id: "candidate", label: "Candidatos", count: segmentCounts.candidate },
      { id: "employee", label: "Empleados", count: segmentCounts.employee },
      { id: "admin", label: "Staff Admin", count: segmentCounts.admin },
    ];

  const currentPageIndex = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;
  const totalPages = Math.max(1, table.getPageCount());
  const startItem =
    filteredData.length === 0 ? 0 : currentPageIndex * currentPageSize + 1;
  const endItem = Math.min(
    (currentPageIndex + 1) * currentPageSize,
    filteredData.length
  );

  // Reserve exact height for currentPageSize rows so filters and pages never shift layout
  const tableMinHeight = HEADER_HEIGHT_PX + currentPageSize * ROW_HEIGHT_PX;
  const colWidths = [
    "w-[28%]",
    "w-[15%]",
    "w-[25%]",
    "w-[10%]",
    "w-[11%]",
    "w-[11%]",
  ];

  const hasActiveFilters =
    statusFilter !== "all" ||
    verificationFilter !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Toolbar compacta */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
        {/* Fila 1: Segmentos principales + Búsqueda + Filtros secundarios + CSV */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {segmentTabs.map((tab) => {
              const active = segmentFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSegmentFilter(tab.id);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className={cn(
                    "h-7 px-2.5 rounded-[8px] text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer select-none",
                    active
                      ? "bg-sidebar-accent text-link"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-[11px] tabular-nums opacity-75">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar usuario, correo o empresa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="h-8 pl-8 pr-7 rounded-[8px] bg-background border-control-border text-[12.5px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setSearchQuery("");
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                if (val) {
                  setStatusFilter(val as StatusFilter);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filtrar por estado"
                className="w-[132px] rounded-[8px] border-control-border bg-background text-[12px]"
              >
                <SelectValue>{STATUS_FILTER_LABELS[statusFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border bg-popover">
                <SelectItem value="all" className="text-[12px]">
                  Estado: Todos
                </SelectItem>
                <SelectItem value="Activo" className="text-[12px]">
                  Activos
                </SelectItem>
                <SelectItem value="Suspendido" className="text-[12px]">
                  Suspendidos
                </SelectItem>
                <SelectItem value="Inactivo" className="text-[12px]">
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={(val) => {
                if (val) {
                  setVerificationFilter(val as VerificationFilter);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filtrar por verificación"
                className="w-[132px] rounded-[8px] border-control-border bg-background text-[12px]"
              >
                <SelectValue>
                  {VERIFICATION_FILTER_LABELS[verificationFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border bg-popover">
                <SelectItem value="all" className="text-[12px]">
                  Sello: Todos
                </SelectItem>
                <SelectItem value="verified" className="text-[12px]">
                  Verificados
                </SelectItem>
                <SelectItem value="unverified" className="text-[12px]">
                  Sin verificar
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setVerificationFilter("all");
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="text-[12px] font-medium text-muted-foreground hover:text-foreground cursor-pointer px-1"
              >
                Limpiar
              </button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 px-2.5 rounded-[8px] border-control-border text-[12px] font-medium gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Aviso contextual al ver Staff Admin */}
        {segmentFilter === "admin" && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-[8px] bg-muted/40 border border-border text-[12px]">
            <span className="text-muted-foreground">
              Los permisos granulares y sub-roles del equipo interno se administran en el módulo de Staff.
            </span>
            <Link
              href="/dashboard/admin/staff"
              className="font-medium text-link hover:underline shrink-0"
            >
              Ir a Staff →
            </Link>
          </div>
        )}
      </div>

      {/* Tabla compacta sin layout shift */}
      <div
        className="overflow-x-auto"
        style={{ minHeight: `${tableMinHeight}px` }}
      >
        <Table className="w-full table-fixed min-w-[780px]">
          <TableHeader className="bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent h-9"
              >
                {headerGroup.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-9 px-4 text-[11.5px] font-semibold text-muted-foreground",
                      colWidths[idx]
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  style={{ height: `${currentPageSize * ROW_HEIGHT_PX}px` }}
                  className="text-center text-muted-foreground align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UserIcon className="size-5 text-muted-foreground/50" />
                    <p className="text-[13px] font-medium text-foreground">
                      No se encontraron usuarios
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Ajusta la búsqueda o los filtros activos.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-[54px] hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pie de paginación compacto */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {filteredData.length === 0
            ? "0 resultados"
            : `Mostrando ${startItem}–${endItem} de ${filteredData.length}`}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground hidden sm:inline">
              Filas:
            </span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(val) => {
                const next = Number(val);
                if (next > 0) {
                  setPagination({ pageIndex: 0, pageSize: next });
                }
              }}
            >
              <SelectTrigger
                aria-label="Filas por página"
                className="h-7 w-[64px] rounded-[8px] border-control-border bg-background text-[12px] tabular-nums"
              >
                <SelectValue>{currentPageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border bg-popover">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-[12px] tabular-nums"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground tabular-nums min-w-[72px] text-center">
              Pág. {currentPageIndex + 1} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Página anterior"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="size-7 rounded-[8px] border-control-border cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Página siguiente"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="size-7 rounded-[8px] border-control-border cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Cambiar Rol */}
      <Dialog
        open={Boolean(roleModalUser)}
        onOpenChange={(open) => !open && setRoleModalUser(null)}
      >
        <DialogContent className="max-w-md rounded-[16px] p-5 border-border bg-card">
          <DialogHeader className="gap-1 pb-2">
            <DialogTitle className="text-[16px] font-semibold text-foreground">
              Cambiar rol de cuenta
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-muted-foreground">
              Modifica los privilegios para{" "}
              <strong className="text-foreground">{roleModalUser?.name}</strong>{" "}
              ({roleModalUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-[12px] font-medium text-muted-foreground">
              Nuevo rol
            </Label>
            <Select
              value={newSelectedRole}
              onValueChange={(val) => {
                if (val === "admin" || val === "candidate" || val === "company") {
                  setNewSelectedRole(val);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-[8px] bg-background border-control-border text-[13px]">
                <SelectValue>{ROLE_LABELS[newSelectedRole]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border">
                <SelectGroup>
                  <SelectItem value="candidate" className="text-[12.5px]">
                    Candidato / Empleado
                  </SelectItem>
                  <SelectItem value="company" className="text-[12.5px]">
                    Dueño de empresa
                  </SelectItem>
                  <SelectItem value="admin" className="text-[12.5px]">
                    Staff Administrador
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleModalUser(null)}
              disabled={isUpdatingRole}
              className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRoleChange}
              disabled={isUpdatingRole}
              className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer gap-1.5"
            >
              {isUpdatingRole && <Loader2 className="size-3.5 animate-spin" />}
              <span>Guardar rol</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación: Suspender / Reactivar */}
      <AlertDialog
        open={Boolean(statusDialogUser)}
        onOpenChange={(open) => !open && setStatusDialogUser(null)}
      >
        <AlertDialogContent className="rounded-[16px] max-w-md p-5 border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-semibold text-foreground">
              {statusDialogUser?.status === "Activo"
                ? "Suspender acceso"
                : "Reactivar cuenta"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-muted-foreground pt-1 leading-relaxed">
              {statusDialogUser?.status === "Activo" ? (
                <>
                  ¿Suspender el acceso de{" "}
                  <strong className="text-foreground">
                    {statusDialogUser?.name}
                  </strong>
                  ? No podrá iniciar sesión hasta ser reactivado.
                </>
              ) : (
                <>
                  ¿Reactivar la cuenta de{" "}
                  <strong className="text-foreground">
                    {statusDialogUser?.name}
                  </strong>{" "}
                  para restaurar su acceso?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel
              disabled={isUpdatingStatus}
              className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusToggle}
              disabled={isUpdatingStatus}
              className={cn(
                "h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold cursor-pointer",
                statusDialogUser?.status === "Activo"
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {isUpdatingStatus
                ? "Procesando..."
                : statusDialogUser?.status === "Activo"
                  ? "Suspender"
                  : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drawer: Editar ficha */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-5 max-w-lg mx-auto rounded-t-[16px] border-border bg-card">
          <DrawerHeader className="p-0 pb-3 text-left">
            <DrawerTitle className="text-[16px] font-semibold text-foreground">
              {drawerUser?.name}
            </DrawerTitle>
            <DrawerDescription className="text-[12px] text-muted-foreground">
              {drawerUser
                ? `${SEGMENT_META[drawerUser.segment].label} · ${drawerUser.contextTitle} · Registro ${drawerUser.createdAt}`
                : ""}
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSaveDrawer} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[12px] font-medium text-muted-foreground">
                Nombre completo
              </Label>
              <Input
                value={drawerName}
                onChange={(e) => setDrawerName(e.target.value)}
                required
                className="h-9 rounded-[8px] bg-background border-control-border text-[13px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px] font-medium text-muted-foreground">
                Correo electrónico
              </Label>
              <Input
                value={drawerUser?.email || ""}
                disabled
                className="h-9 rounded-[8px] bg-muted/40 border-border text-[13px] font-mono text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[12px] font-medium text-muted-foreground">
                Rol en la plataforma
              </Label>
              <Select
                value={drawerRole}
                onValueChange={(val) => {
                  if (val === "admin" || val === "candidate" || val === "company") {
                    setDrawerRole(val);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full rounded-[8px] bg-background border-control-border text-[13px]">
                  <SelectValue>{ROLE_LABELS[drawerRole]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border-border">
                  <SelectGroup>
                    <SelectItem value="candidate" className="text-[12.5px]">
                      Candidato / Empleado
                    </SelectItem>
                    <SelectItem value="company" className="text-[12.5px]">
                      Dueño de empresa
                    </SelectItem>
                    <SelectItem value="admin" className="text-[12.5px]">
                      Staff Administrador
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DrawerFooter className="p-0 pt-3 flex flex-row items-center justify-end gap-2">
              <DrawerClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 rounded-[8px] text-[12.5px] font-medium border-control-border cursor-pointer"
                  />
                }
              >
                Cancelar
              </DrawerClose>
              <Button
                type="submit"
                disabled={isSavingDrawer}
                className="h-8 px-3.5 rounded-[8px] text-[12.5px] font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer gap-1.5"
              >
                {isSavingDrawer && <Loader2 className="size-3.5 animate-spin" />}
                <span>Guardar cambios</span>
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
