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

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  Loader2,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  UserPlus,
  Search,
  KeyRound,
  Building2,
  Mail,
  UserX,
  Download,
  Shield,
  Clock,
  ArrowUpDown,
  Phone,
} from "@/components/ui/icons";

import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  type AdminStaffItem,
} from "@/modules/admin/types/staff";
import {
  EditStaffModal,
  DeleteStaffDialog,
} from "@/modules/admin/components/staff-modal";
import { toggleAdminStaffStatus } from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  if (!name) return "AD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface StaffDataTableProps {
  initialData: AdminStaffItem[];
}

export function StaffDataTable({ initialData }: StaffDataTableProps) {
  const [data, setData] = React.useState<AdminStaffItem[]>(initialData);
  const [activeTab, setActiveTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Modal States
  const [editingStaff, setEditingStaff] = React.useState<AdminStaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = React.useState<AdminStaffItem | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Quick status toggle
  const handleStatusToggle = async (staff: AdminStaffItem, newStatus: "active" | "inactive" | "suspended") => {
    try {
      await toggleAdminStaffStatus(staff.profileId, newStatus);
      setData((prev) =>
        prev.map((item) =>
          item.profileId === staff.profileId ? { ...item, status: newStatus } : item
        )
      );
      toast.success(`Estado de ${staff.name} actualizado a ${newStatus === "active" ? "Activo" : "Inactivo"}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al cambiar estado");
    }
  };

  const columns = React.useMemo<ColumnDef<AdminStaffItem>[]>(
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
            <span>Personal</span>
            <ArrowUpDown className="size-3 ml-1" />
          </Button>
        ),
        cell: ({ row }) => {
          const staff = row.original;
          const initials = getInitials(staff.name);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-10 rounded-2xl border border-border/60 bg-muted shrink-0">
                <AvatarImage src={staff.avatar} alt={staff.name} />
                <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-foreground truncate">
                    {staff.name}
                  </span>
                  {staff.subRole === "super_admin" && (
                    <ShieldCheck className="size-3.5 text-purple-500 shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 truncate font-mono">
                  <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                  {staff.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "subRole",
        header: "Rol de Personal",
        cell: ({ row }) => {
          const subRole = row.original.subRole;
          const info = SUB_ROLE_LABELS[subRole] || SUB_ROLE_LABELS.ops_admin;
          return (
            <Badge
              variant="outline"
              className={cn(
                "px-2.5 py-0.5 text-xs font-bold rounded-xl gap-1.5 border shadow-2xs",
                subRole === "super_admin"
                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                  : subRole === "verification_admin"
                  ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                  : subRole === "ops_admin"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : subRole === "content_admin"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              )}
            >
              <Shield className="size-3" />
              <span>{info.label}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "department",
        header: "Departamento",
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permisos Granulares",
        cell: ({ row }) => {
          const count = row.original.permissions?.length || 0;
          const total = ALL_PERMISSIONS.length;
          const isFullAccess = count === total || row.original.subRole === "super_admin";
          return (
            <Badge
              variant="outline"
              className={cn(
                "px-2.5 py-0.5 text-xs font-bold gap-1 rounded-xl border",
                isFullAccess
                  ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  : "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              <KeyRound className="size-3" />
              <span>{isFullAccess ? "Acceso Total" : `${count}/${total} Permisos`}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "active") {
            return (
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 text-xs font-bold border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-xl"
              >
                <CircleCheck className="size-3" />
                <span>Activo</span>
              </Badge>
            );
          }
          if (status === "suspended") {
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
              className="px-2.5 py-0.5 text-xs font-bold border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 rounded-xl"
            >
              <Clock className="size-3" />
              <span>Inactivo</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => <div className="text-right">Fecha Alta</div>,
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
          const staff = row.original;

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingStaff(staff)}
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-border/60 hover:bg-muted"
              >
                <KeyRound className="size-3 text-purple-600" />
                <span>Permisos</span>
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
                    onClick={() => setEditingStaff(staff)}
                  >
                    <KeyRound className="size-4 text-purple-600" />
                    <span>Editar Información & Permisos</span>
                  </DropdownMenuItem>

                  {staff.status === "active" ? (
                    <DropdownMenuItem
                      className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2"
                      onClick={() => handleStatusToggle(staff, "inactive")}
                    >
                      <Clock className="size-4 text-amber-500" />
                      <span>Desactivar Cuenta</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2"
                      onClick={() => handleStatusToggle(staff, "active")}
                    >
                      <CircleCheck className="size-4 text-emerald-500" />
                      <span>Reactivar Cuenta</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    variant="destructive"
                    className="text-xs font-bold cursor-pointer gap-2 rounded-xl py-2 text-rose-600"
                    onClick={() => setDeletingStaff(staff)}
                  >
                    <UserX className="size-4" />
                    <span>Dar de Baja Personal</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // Filtered dataset
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Role filter
      if (activeTab !== "all" && item.subRole !== activeTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesEmail = item.email.toLowerCase().includes(q);
        const matchesDept = item.department.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) {
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Nombre", "Email", "Rol", "Departamento", "Estado", "Permisos", "Fecha Registro"];
    const rows = filteredData.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.subRole}"`,
      `"${s.department}"`,
      `"${s.status}"`,
      `"${s.permissions?.length || 0} permisos"`,
      `"${s.createdAt}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff_kanpro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Listado de personal exportado en CSV");
  };

  const roleCounts = React.useMemo(() => {
    return {
      all: data.length,
      super_admin: data.filter((s) => s.subRole === "super_admin").length,
      ops_admin: data.filter((s) => s.subRole === "ops_admin").length,
      verification_admin: data.filter((s) => s.subRole === "verification_admin").length,
      content_admin: data.filter((s) => s.subRole === "content_admin").length,
      support: data.filter((s) => s.subRole === "support").length,
    };
  }, [data]);

  return (
    <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden">
      
      {/* Top Toolbar Container */}
      <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
        
        {/* Row 1: Search, Controls & CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar personal por nombre, correo o área..."
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
                        ? "Personal"
                        : column.id === "subRole"
                        ? "Rol"
                        : column.id === "department"
                        ? "Departamento"
                        : column.id === "permissions"
                        ? "Permisos"
                        : column.id === "status"
                        ? "Estado"
                        : column.id === "createdAt"
                        ? "Fecha Registro"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              render={<Link href="/dashboard/admin/staff/new" />}
              size="sm"
              className="h-10 px-4 rounded-2xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              <UserPlus className="size-4" />
              <span>Dar de Alta Personal</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {[
            { key: "all", label: "Todo el Personal", count: roleCounts.all },
            { key: "super_admin", label: "Super Admins", count: roleCounts.super_admin },
            { key: "ops_admin", label: "Operaciones", count: roleCounts.ops_admin },
            { key: "verification_admin", label: "Verificación", count: roleCounts.verification_admin },
            { key: "content_admin", label: "Contenido", count: roleCounts.content_admin },
            { key: "support", label: "Soporte", count: roleCounts.support },
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

      {/* TanStack Table View */}
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
                    <ShieldCheck className="size-8 stroke-[1.4] text-muted-foreground/50" />
                    <p className="text-sm font-bold text-foreground">No se encontró personal registrado</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      No hay registros que coincidan con la búsqueda o filtro de rol seleccionado.
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
            Mostrando {table.getRowModel().rows.length} de {filteredData.length} miembros del equipo
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="size-8 rounded-lg border-border/60"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="size-8 rounded-lg border-border/60"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="size-8 rounded-lg border-border/60"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="size-8 rounded-lg border-border/60"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <EditStaffModal
        staff={editingStaff}
        open={!!editingStaff}
        onOpenChange={(open) => {
          if (!open) setEditingStaff(null);
        }}
        onSuccess={() => {
          setEditingStaff(null);
        }}
      />
      <DeleteStaffDialog
        staff={deletingStaff}
        open={!!deletingStaff}
        onOpenChange={(open) => {
          if (!open) setDeletingStaff(null);
        }}
        onSuccess={() => {
          if (deletingStaff) {
            setData((prev) => prev.filter((s) => s.id !== deletingStaff.id));
          }
          setDeletingStaff(null);
        }}
      />
    </Card>
  );
}
