"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
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
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  KeyRound,
  MoreVertical,
  Search,
  ShieldCheck,
  UserX,
  X,
} from "@/components/ui/icons";
import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  type AdminStaffItem,
  type AdminStaffStatus,
  type AdminSubRole,
} from "@/modules/admin/types/staff";
import {
  EditStaffModal,
  DeleteStaffDialog,
} from "@/modules/admin/components/staff-modal";
import { toggleAdminStaffStatus } from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | AdminSubRole;
type StatusFilter = "all" | AdminStaffStatus;

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const ROW_HEIGHT_PX = 54;
const HEADER_HEIGHT_PX = 36;

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Estado: Todos",
  active: "Activos",
  inactive: "Inactivos",
  suspended: "Suspendidos",
};

const STATUS_LABELS: Record<AdminStaffStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

function getInitials(name: string): string {
  if (!name) return "AD";
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

interface StaffDataTableProps {
  initialData: AdminStaffItem[];
}

export function StaffDataTable({ initialData }: StaffDataTableProps) {
  const [data, setData] = React.useState<AdminStaffItem[]>(initialData);
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [editingStaff, setEditingStaff] = React.useState<AdminStaffItem | null>(
    null
  );
  const [deletingStaff, setDeletingStaff] =
    React.useState<AdminStaffItem | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleStatusToggle = React.useCallback(
    async (staff: AdminStaffItem, newStatus: AdminStaffStatus) => {
      try {
        await toggleAdminStaffStatus(staff.profileId, newStatus);
        setData((prev) =>
          prev.map((item) =>
            item.profileId === staff.profileId
              ? { ...item, status: newStatus }
              : item
          )
        );
        toast.success(
          `Estado de ${staff.name} actualizado a ${STATUS_LABELS[newStatus]}`
        );
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Error al cambiar estado"));
      }
    },
    []
  );

  const columns = React.useMemo<ColumnDef<AdminStaffItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>Personal</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => {
          const staff = row.original;
          const initials = getInitials(staff.name);
          return (
            <button
              type="button"
              onClick={() => setEditingStaff(staff)}
              className="flex items-center gap-2.5 min-w-0 w-full text-left cursor-pointer group"
            >
              <Avatar className="size-[30px] rounded-[8px] shrink-0 after:hidden">
                <AvatarImage
                  src={staff.avatar}
                  alt={staff.name}
                  className="rounded-[8px] object-cover"
                />
                <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[11px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate group-hover:text-link transition-colors">
                    {staff.name}
                  </span>
                  {staff.subRole === "super_admin" && (
                    <ShieldCheck className="size-3.5 text-link shrink-0" />
                  )}
                </div>
                <span className="text-[11.5px] text-muted-foreground block truncate">
                  {staff.email}
                </span>
              </div>
            </button>
          );
        },
      },
      {
        accessorKey: "subRole",
        header: "Sub-rol",
        cell: ({ row }) => {
          const subRole = row.original.subRole;
          const info = SUB_ROLE_LABELS[subRole] || SUB_ROLE_LABELS.ops_admin;
          return (
            <Badge
              variant={subRole === "super_admin" ? "secondary" : "outline"}
              className="rounded-[6px] px-2 py-0.5 text-[11px] font-medium"
            >
              {info.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "department",
        header: "Departamento",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-foreground block truncate">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permisos",
        cell: ({ row }) => {
          const count = row.original.permissions?.length || 0;
          const total = ALL_PERMISSIONS.length;
          const isFullAccess =
            count === total || row.original.subRole === "super_admin";
          return (
            <Badge
              variant="outline"
              className="rounded-[6px] px-2 py-0.5 text-[11px] font-medium tabular-nums"
            >
              {isFullAccess ? "Acceso total" : `${count} / ${total}`}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          const colorClass =
            status === "active"
              ? "text-success-foreground"
              : status === "suspended"
                ? "text-destructive"
                : "text-warning-foreground";
          return (
            <span
              className={cn(
                "text-[12px] font-semibold whitespace-nowrap",
                colorClass
              )}
            >
              {STATUS_LABELS[status]}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
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
          const staff = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setEditingStaff(staff)}
                className="text-[12px] font-medium text-link hover:underline whitespace-nowrap cursor-pointer"
              >
                Permisos →
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Acciones para ${staff.name}`}
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
                    onClick={() => setEditingStaff(staff)}
                  >
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    <span>Editar y permisos</span>
                  </DropdownMenuItem>

                  {staff.status === "active" ? (
                    <DropdownMenuItem
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px]"
                      onClick={() => handleStatusToggle(staff, "inactive")}
                    >
                      <Clock className="size-3.5 text-warning-foreground" />
                      <span>Desactivar cuenta</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px] text-success-foreground"
                      onClick={() => handleStatusToggle(staff, "active")}
                    >
                      <CircleCheck className="size-3.5" />
                      <span>Reactivar cuenta</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    variant="destructive"
                    className="h-8 px-2.5 text-[12.5px] font-medium cursor-pointer gap-2 rounded-[8px] text-destructive"
                    onClick={() => setDeletingStaff(staff)}
                  >
                    <UserX className="size-3.5" />
                    <span>Revocar acceso</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleStatusToggle]
  );

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      if (roleFilter !== "all" && item.subRole !== roleFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (q) {
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [data, roleFilter, statusFilter, searchQuery]);

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
      "Sub-rol",
      "Departamento",
      "Estado",
      "Permisos",
      "Fecha Alta",
    ];
    const rows = filteredData.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${SUB_ROLE_LABELS[s.subRole]?.label || s.subRole}"`,
      `"${s.department}"`,
      `"${STATUS_LABELS[s.status]}"`,
      `"${s.permissions?.length || 0} permisos"`,
      `"${s.createdAt}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff_kanpro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Listado de personal exportado a CSV");
  };

  const roleCounts = React.useMemo(
    () => ({
      all: data.length,
      super_admin: data.filter((s) => s.subRole === "super_admin").length,
      ops_admin: data.filter((s) => s.subRole === "ops_admin").length,
      verification_admin: data.filter((s) => s.subRole === "verification_admin")
        .length,
      content_admin: data.filter((s) => s.subRole === "content_admin").length,
      support: data.filter((s) => s.subRole === "support").length,
    }),
    [data]
  );

  const roleTabs: Array<{ id: RoleFilter; label: string; count: number }> = [
    { id: "all", label: "Todos", count: roleCounts.all },
    { id: "super_admin", label: "Super Admin", count: roleCounts.super_admin },
    { id: "ops_admin", label: "Operaciones", count: roleCounts.ops_admin },
    {
      id: "verification_admin",
      label: "Verificación",
      count: roleCounts.verification_admin,
    },
    { id: "content_admin", label: "Contenido", count: roleCounts.content_admin },
    { id: "support", label: "Soporte", count: roleCounts.support },
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

  // Reserve exact height for currentPageSize rows to eliminate layout shift
  const tableMinHeight = HEADER_HEIGHT_PX + currentPageSize * ROW_HEIGHT_PX;
  const colWidths = [
    "w-[26%]",
    "w-[16%]",
    "w-[17%]",
    "w-[11%]",
    "w-[9%]",
    "w-[10%]",
    "w-[11%]",
  ];

  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Toolbar compacta */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {roleTabs.map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setRoleFilter(tab.id);
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
            <div className="relative flex-1 sm:w-56 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar personal o área..."
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
                <SelectItem value="active" className="text-[12px]">
                  Activos
                </SelectItem>
                <SelectItem value="inactive" className="text-[12px]">
                  Inactivos
                </SelectItem>
                <SelectItem value="suspended" className="text-[12px]">
                  Suspendidos
                </SelectItem>
              </SelectContent>
            </Select>

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
                    <ShieldCheck className="size-5 text-muted-foreground/50" />
                    <p className="text-[13px] font-medium text-foreground">
                      No se encontró personal administrativo
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      Ajusta la búsqueda o los filtros seleccionados.
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

      {/* Modales */}
      <EditStaffModal
        staff={editingStaff}
        open={Boolean(editingStaff)}
        onOpenChange={(open) => !open && setEditingStaff(null)}
      />

      <DeleteStaffDialog
        staff={deletingStaff}
        open={Boolean(deletingStaff)}
        onOpenChange={(open) => !open && setDeletingStaff(null)}
        onSuccess={() => {
          if (deletingStaff) {
            setData((prev) =>
              prev.filter((item) => item.profileId !== deletingStaff.profileId)
            );
          }
        }}
      />
    </section>
  );
}
