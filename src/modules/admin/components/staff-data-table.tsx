"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GripVerticalIcon,
  CircleCheckIcon,
  LoaderIcon,
  EllipsisVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  SearchIcon,
  KeyRoundIcon,
  Building2Icon,
  MailIcon,
  UserXIcon,
} from "lucide-react";

import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  type AdminStaffItem,
} from "@/modules/admin/types/staff";
import {
  CreateStaffModal,
  EditStaffModal,
  DeleteStaffDialog,
} from "@/modules/admin/components/staff-modal";
import { toggleAdminStaffStatus } from "@/app/(dashboard)/dashboard/admin/staff/actions";

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent"
    >
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Arrastrar para ordenar</span>
    </Button>
  );
}

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
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<AdminStaffItem | null>(null);
  const [deletingStaff, setDeletingStaff] = React.useState<AdminStaffItem | null>(null);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const columns: ColumnDef<AdminStaffItem>[] = [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Personal / Administrador",
      cell: ({ row }) => {
        const staff = row.original;
        const initials = getInitials(staff.name);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-full border border-purple-500/20 shrink-0">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight text-foreground">
                {staff.name}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MailIcon className="size-3 text-muted-foreground/70 shrink-0" />
                {staff.email}
              </span>
            </div>
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "subRole",
      header: "Rol de Personal",
      cell: ({ row }) => {
        const subRole = row.original.subRole;
        const info = SUB_ROLE_LABELS[subRole] || SUB_ROLE_LABELS.ops_admin;
        return (
          <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold rounded-md gap-1 ${info.badgeClass}`}>
            <ShieldCheckIcon className="size-3" />
            {info.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Departamento",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Building2Icon className="size-3.5 text-muted-foreground/70 shrink-0" />
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
        const isFullAccess = count === total;
        return (
          <Badge
            variant="outline"
            className={`px-2 py-0.5 text-xs font-medium gap-1 rounded-md ${
              isFullAccess
                ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "border-border/40 bg-muted/30 text-muted-foreground"
            }`}
          >
            <KeyRoundIcon className="size-3" />
            {count}/{total} Permisos
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
            <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 gap-1.5 rounded-md">
              <CircleCheckIcon className="size-3" />
              Activo
            </Badge>
          );
        }
        if (status === "suspended") {
          return (
            <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 gap-1.5 rounded-md">
              <UserXIcon className="size-3" />
              Suspendido
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 rounded-md">
            <LoaderIcon className="size-3 animate-spin" />
            Inactivo
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => <div className="w-full text-right">Fecha Registro</div>,
      cell: ({ row }) => (
        <div className="w-full text-right text-xs font-medium text-muted-foreground">
          {row.original.createdAt}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original;

        const handleStatusToggle = async (newStatus: "active" | "inactive" | "suspended") => {
          try {
            await toggleAdminStaffStatus(staff.profileId, newStatus);
            toast.success(`Estado de ${staff.name} cambiado a ${newStatus}`);
          } catch (err: unknown) {
            toast.error((err as Error).message || "Error al cambiar estado");
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                size="icon"
              >
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Abrir opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem
                className="text-xs font-medium cursor-pointer gap-2"
                onClick={() => setEditingStaff(staff)}
              >
                <KeyRoundIcon className="size-3.5 text-purple-500" />
                Editar & Permisos
              </DropdownMenuItem>
              {staff.status === "active" ? (
                <DropdownMenuItem
                  className="text-xs font-medium cursor-pointer gap-2"
                  onClick={() => handleStatusToggle("inactive")}
                >
                  <LoaderIcon className="size-3.5 text-amber-500" />
                  Desactivar Acceso
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-xs font-medium cursor-pointer gap-2"
                  onClick={() => handleStatusToggle("active")}
                >
                  <CircleCheckIcon className="size-3.5 text-green-500" />
                  Reactivar Acceso
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs font-medium cursor-pointer gap-2"
                onClick={() => setDeletingStaff(staff)}
              >
                <UserXIcon className="size-3.5" />
                Dar de Baja
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  function DraggableRow({ row }: { row: Row<AdminStaffItem> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
      id: row.original.id,
    });

    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-muted/40 transition-colors"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className="py-3 px-4">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleSubRoleFilter = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      table.getColumn("subRole")?.setFilterValue(undefined);
    } else {
      table.getColumn("subRole")?.setFilterValue(value);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    table.getColumn("name")?.setFilterValue(value || undefined);
  };

  return (
    <Card className="@container/card border border-border/20 bg-card p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={handleSubRoleFilter} className="w-full lg:w-auto">
            <Select value={activeTab} onValueChange={handleSubRoleFilter}>
              <SelectTrigger className="flex w-full sm:w-fit @4xl/main:hidden h-9 text-xs font-semibold" id="staff-role-selector">
                <SelectValue placeholder="Filtrar por rol de personal" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todo el Personal</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                  <SelectItem value="ops_admin">Operaciones</SelectItem>
                  <SelectItem value="verification_admin">Verificación</SelectItem>
                  <SelectItem value="content_admin">Contenido</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="super_admin">
                Super Admin <Badge variant="secondary">{data.filter((u) => u.subRole === "super_admin").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ops_admin">
                Operaciones <Badge variant="secondary">{data.filter((u) => u.subRole === "ops_admin").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="verification_admin">
                Verificación <Badge variant="secondary">{data.filter((u) => u.subRole === "verification_admin").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="content_admin">
                Contenido <Badge variant="secondary">{data.filter((u) => u.subRole === "content_admin").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="support">
                Soporte <Badge variant="secondary">{data.filter((u) => u.subRole === "support").length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar personal por nombre o correo..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 w-full pl-9 text-xs rounded-lg"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold w-full sm:w-auto">
                  <Columns3Icon className="size-3.5 mr-1.5" />
                  Columnas
                  <ChevronDownIcon className="size-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={() => setCreateModalOpen(true)}
            >
              <UserPlusIcon className="size-3.5" />
              <span>Dar de Alta Personal</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-hidden rounded-lg border border-border/20">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan} className="text-xs font-semibold">
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
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-sm font-medium text-muted-foreground"
                    >
                      No se encontraron miembros del personal registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-2">
          <div className="text-xs text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <Label htmlFor="rows-per-page-staff" className="text-xs font-medium">
                Filas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-16 h-8 text-xs" id="rows-per-page-staff">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <CreateStaffModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      <EditStaffModal
        staff={editingStaff}
        open={!!editingStaff}
        onOpenChange={(open) => {
          if (!open) setEditingStaff(null);
        }}
      />
      <DeleteStaffDialog
        staff={deletingStaff}
        open={!!deletingStaff}
        onOpenChange={(open) => {
          if (!open) setDeletingStaff(null);
        }}
      />
    </Card>
  );
}
