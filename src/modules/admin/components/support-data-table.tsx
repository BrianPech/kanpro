"use client";

import * as React from "react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SearchIcon,
  WrenchIcon,
  PlusIcon,
  MessageSquareIcon,
  MailIcon,
  Building2Icon,
  UserIcon,
} from "lucide-react";

import {
  CATEGORY_LABELS,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  type SupportTicketItem,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/modules/admin/types/support";
import { TicketDetailModal } from "@/modules/admin/components/ticket-detail-modal";
import { SupportToolsDrawer } from "@/modules/admin/components/support-tools-drawer";
import {
  createSupportTicket,
  updateTicketStatus,
} from "@/app/(dashboard)/dashboard/admin/support/actions";

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

interface SupportDataTableProps {
  initialData: SupportTicketItem[];
}

export function SupportDataTable({ initialData }: SupportDataTableProps) {
  const [data, setData] = React.useState<SupportTicketItem[]>(initialData);
  const [activeStatusTab, setActiveStatusTab] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Modals
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicketItem | null>(null);
  const [toolsDrawerOpen, setToolsDrawerOpen] = React.useState(false);
  const [createTicketOpen, setCreateTicketOpen] = React.useState(false);

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

  const columns: ColumnDef<SupportTicketItem>[] = [
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
      accessorKey: "ticketNumber",
      header: "Ticket #",
      cell: ({ row }) => (
        <Link href={`/dashboard/admin/support/tickets/${row.original.id}`}>
          <Badge variant="outline" className="font-mono text-xs font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer">
            {row.original.ticketNumber}
          </Badge>
        </Link>
      ),
    },
    {
      accessorKey: "userName",
      header: "Usuario Solicitante",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={t.userAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {t.userName?.substring(0, 2)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-foreground flex items-center gap-1">
                {t.userRole === "company" ? <Building2Icon className="size-3 text-amber-500" /> : <UserIcon className="size-3 text-blue-500" />}
                {t.userName}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MailIcon className="size-3 text-muted-foreground/60 shrink-0" />
                {t.userEmail}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "Asunto / Incidencia",
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[280px]">
          <span className="font-semibold text-xs text-foreground line-clamp-1">
            {row.original.subject}
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {CATEGORY_LABELS[row.original.category]}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const info = PRIORITY_CONFIG[row.original.priority] || PRIORITY_CONFIG.media;
        return (
          <Badge variant="outline" className={`px-2 py-0.5 text-xs ${info.badgeClass}`}>
            {info.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const info = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.abierto;
        return (
          <Badge variant="outline" className={`px-2 py-0.5 text-xs ${info.badgeClass}`}>
            {info.label}
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
        const ticket = row.original;

        const handleQuickStatusChange = async (newStatus: TicketStatus) => {
          try {
            await updateTicketStatus(ticket.id, newStatus, ticket.priority);
            toast.success(`Ticket #${ticket.ticketNumber} actualizado a ${STATUS_CONFIG[newStatus].label}`);
          } catch (err: unknown) {
            toast.error((err as Error).message || "Error al actualizar estado");
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
                asChild
                className="text-xs font-medium cursor-pointer gap-2"
              >
                <Link href={`/dashboard/admin/support/tickets/${ticket.id}`}>
                  <MessageSquareIcon className="size-3.5 text-purple-500" />
                  <span>Atender / Ver Detalle</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ticket.status !== "en_proceso" && (
                <DropdownMenuItem
                  className="text-xs font-medium cursor-pointer gap-2"
                  onClick={() => handleQuickStatusChange("en_proceso")}
                >
                  <LoaderIcon className="size-3.5 text-purple-500" />
                  Tomar en Atención
                </DropdownMenuItem>
              )}
              {ticket.status !== "resuelto" && (
                <DropdownMenuItem
                  className="text-xs font-medium cursor-pointer gap-2 text-green-600 font-semibold"
                  onClick={() => handleQuickStatusChange("resuelto")}
                >
                  <CircleCheckIcon className="size-3.5 text-green-500" />
                  Marcar como Resuelto
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  function DraggableRow({ row }: { row: Row<SupportTicketItem> }) {
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

  const handleStatusFilter = (value: string) => {
    setActiveStatusTab(value);
    if (value === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    table.getColumn("subject")?.setFilterValue(value || undefined);
  };

  return (
    <Card className="@container/card border border-border/20 bg-card p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4">
        {/* Controls Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <Tabs value={activeStatusTab} onValueChange={handleStatusFilter} className="w-full lg:w-auto">
            <Select value={activeStatusTab} onValueChange={handleStatusFilter}>
              <SelectTrigger className="flex w-full sm:w-fit @4xl/main:hidden h-9 text-xs font-semibold" id="ticket-status-selector">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos los Tickets</SelectItem>
                  <SelectItem value="abierto">Abiertos</SelectItem>
                  <SelectItem value="en_proceso">En Atención</SelectItem>
                  <SelectItem value="resuelto">Resueltos</SelectItem>
                  <SelectItem value="cerrado">Cerrados</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="abierto">
                Abiertos <Badge variant="secondary">{data.filter((t) => t.status === "abierto").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="en_proceso">
                En Atención <Badge variant="secondary">{data.filter((t) => t.status === "en_proceso").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="resuelto">
                Resueltos <Badge variant="secondary">{data.filter((t) => t.status === "resuelto").length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cerrado">
                Cerrados <Badge variant="secondary">{data.filter((t) => t.status === "cerrado").length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ticket por asunto o #TK..."
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

            {/* Support Tools Drawer Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 w-full sm:w-auto"
              onClick={() => setToolsDrawerOpen(true)}
            >
              <WrenchIcon className="size-3.5" />
              <span>Herramientas Asistencia</span>
            </Button>

            {/* Create Ticket Trigger */}
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={() => setCreateTicketOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              <span>Nuevo Ticket</span>
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
                      No se encontraron tickets de soporte registrados.
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
              <Label htmlFor="rows-per-page-support" className="text-xs font-medium">
                Filas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-16 h-8 text-xs" id="rows-per-page-support">
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

      {/* Modals */}
      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      />

      <SupportToolsDrawer
        open={toolsDrawerOpen}
        onOpenChange={setToolsDrawerOpen}
      />

      <CreateTicketModal
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
      />
    </Card>
  );
}

function CreateTicketModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [category, setCategory] = React.useState<TicketCategory>("cuenta_acceso");
  const [priority, setPriority] = React.useState<TicketPriority>("media");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const userName = formData.get("userName") as string;
    const userEmail = formData.get("userEmail") as string;
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;

    try {
      const res = await createSupportTicket({
        userName,
        userEmail,
        subject,
        description,
        category,
        priority,
      });

      toast.success(`Ticket #${res.ticketNumber} registrado en el sistema`);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al registrar ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-bold text-foreground">
            Registrar Incidencia / Ticket de Soporte Interno
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ingrese los datos de la solicitud o llamada de asistencia recibida de un usuario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-user-name" className="text-xs font-semibold">Nombre del Usuario *</Label>
              <Input id="ticket-user-name" name="userName" required placeholder="Ej. Roberto Pech" className="h-9 text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-user-email" className="text-xs font-semibold">Correo Electrónico *</Label>
              <Input id="ticket-user-email" name="userEmail" type="email" required placeholder="rpech@gmail.com" className="h-9 text-xs" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-subject" className="text-xs font-semibold">Asunto de la Incidencia *</Label>
            <Input id="ticket-subject" name="subject" required placeholder="Ej. Error al validar INE" className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-category" className="text-xs font-semibold">Categoría</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as TicketCategory)}>
                <SelectTrigger id="ticket-category" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-priority" className="text-xs font-semibold">Prioridad</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as TicketPriority)}>
                <SelectTrigger id="ticket-priority" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="baja" className="text-xs">Baja</SelectItem>
                    <SelectItem value="media" className="text-xs">Media</SelectItem>
                    <SelectItem value="alta" className="text-xs text-amber-600 font-semibold">Alta</SelectItem>
                    <SelectItem value="urgente" className="text-xs text-red-600 font-bold">Urgente</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticket-desc" className="text-xs font-semibold">Descripción del Problema *</Label>
            <Textarea id="ticket-desc" name="description" required placeholder="Detalles de la falla o requerimiento expuesto por el usuario..." className="text-xs min-h-[70px]" />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="text-xs font-semibold">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Creando..." : "Registrar Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
