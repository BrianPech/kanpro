"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { startImpersonating } from "@/lib/auth/impersonation";
import { useIsMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  Building2Icon,
  UserIcon,
  MailIcon,
  SearchIcon,
  UserPlusIcon,
  SparklesIcon,
} from "lucide-react"

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "candidate", "company"]),
  status: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string(),
})

export type UserItem = z.infer<typeof userSchema>

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })

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
  )
}

function getInitials(name: string) {
  if (!name) return "US"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const columns: ColumnDef<UserItem>[] = [
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
    header: "Usuario",
    cell: ({ row }) => <UserCellViewer user={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Correo Electrónico",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
        <MailIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol en Plataforma",
    cell: ({ row }) => {
      const role = row.original.role
      if (role === "admin") {
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-xs font-semibold border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 rounded-md">
            <ShieldCheckIcon className="size-3" />
            Administrador
          </Badge>
        )
      }
      if (role === "company") {
        return (
          <Badge variant="outline" className="px-2 py-0.5 text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 rounded-md">
            <Building2Icon className="size-3" />
            Empresa
          </Badge>
        )
      }
      return (
        <Badge variant="outline" className="px-2 py-0.5 text-xs font-semibold border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 rounded-md">
          <UserIcon className="size-3" />
          Candidato
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium text-muted-foreground gap-1.5 rounded-md">
          {status === "Activo" || status === "Verified" ? (
            <CircleCheckIcon className="size-3.5 fill-green-500 text-white dark:fill-green-400" />
          ) : (
            <LoaderIcon className="size-3.5 animate-spin text-amber-500" />
          )}
          {status === "Verified" || status === "Activo" ? "Activo" : "Pendiente"}
        </Badge>
      )
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
    cell: ({ row }) => (
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
        <DropdownMenuContent align="end" className="w-52 rounded-xl">
          <DropdownMenuItem
            className="text-xs font-semibold cursor-pointer text-purple-600 dark:text-purple-400 gap-2"
            onClick={async () => {
              try {
                toast.loading(`Iniciando impersonación de ${row.original.name}...`);
                const res = await startImpersonating(row.original.id);
                toast.success(`Impersonando a ${res.targetName}`);
                window.location.href = res.redirectUrl;
              } catch (err: unknown) {
                toast.error((err as Error).message || "Error al impersonar.");
              }
            }}
          >
            <SparklesIcon className="size-3.5 text-purple-500" />
            Impersonar (Log in as User)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs font-medium cursor-pointer"
            onClick={() => toast.info(`Viendo perfil de ${row.original.name}`)}
          >
            Ver Detalle
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs font-medium cursor-pointer"
            onClick={() => toast.success(`Rol de ${row.original.name} actualizado`)}
          >
            Editar Rol
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="text-xs font-medium cursor-pointer"
            onClick={() => toast.error(`Usuario ${row.original.name} desactivado`)}
          >
            Desactivar Usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<UserItem> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

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
  )
}

export function UsersDataTable({ data: initialData }: { data: UserItem[] }) {
  const [data, setData] = React.useState(() => initialData)
  const [activeRoleTab, setActiveRoleTab] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

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
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  // Synchronize Tab & Select role filtering
  const handleRoleFilter = (value: string) => {
    setActiveRoleTab(value)
    if (value === "all") {
      table.getColumn("role")?.setFilterValue(undefined)
    } else {
      table.getColumn("role")?.setFilterValue(value)
    }
  }

  // Handle Search Input (Filter by Name or Email)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    table.getColumn("name")?.setFilterValue(value || undefined)
  }

  return (
    <Card className="@container/card border border-border/20 bg-card p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4">
        
        {/* Top Controls Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="w-full lg:w-auto">
            <div className="flex @4xl/main:hidden w-full">
              <Select value={activeRoleTab} onValueChange={handleRoleFilter}>
                <SelectTrigger
                  className="flex w-full sm:w-fit h-9 text-xs font-semibold"
                  id="role-selector"
                >
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos los Usuarios</SelectItem>
                    <SelectItem value="candidate">Candidatos</SelectItem>
                    <SelectItem value="company">Empresas</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Tabs
              value={activeRoleTab}
              onValueChange={handleRoleFilter}
              className="hidden @4xl/main:flex w-full lg:w-auto"
            >
              <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 flex">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="candidate">
                  Candidatos <Badge variant="secondary">{data.filter(u => u.role === "candidate").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="company">
                  Empresas <Badge variant="secondary">{data.filter(u => u.role === "company").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="admin">
                  Administradores <Badge variant="secondary">{data.filter(u => u.role === "admin").length}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto justify-end">
            
            {/* Search Input Filter */}
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 w-full pl-9 text-xs rounded-lg"
              />
            </div>

            {/* Column Selector */}
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
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action Add User */}
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              onClick={() => toast.success("Formulario para registrar nuevo usuario abierto")}
            >
              <UserPlusIcon className="size-3.5" />
              <span>Nuevo Usuario</span>
            </Button>
          </div>
        </div>

        {/* Data Table Content */}
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
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className="text-xs font-semibold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
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
                      No se encontraron usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-2">
          <div className="text-xs text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-xs font-medium">
                Filas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-16 h-8 text-xs" id="rows-per-page">
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
    </Card>
  )
}

function UserCellViewer({ user }: { user: UserItem }) {
  const isMobile = useIsMobile()
  const initials = getInitials(user.name)

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit p-0 h-auto text-left font-semibold text-sm text-foreground hover:text-primary gap-2.5">
          <Avatar className="h-8 w-8 rounded-full border border-border/20 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm leading-tight text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-2xl md:rounded-l-2xl p-6">
        <DrawerHeader className="gap-2 px-0 pt-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-full border border-border/20 shrink-0">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DrawerTitle className="text-xl font-bold tracking-tight">{user.name}</DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                {user.email}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-0 py-4 text-sm">
          <Separator />
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name" className="text-xs font-semibold">Nombre Completo</Label>
              <Input id="user-name" defaultValue={user.name} className="h-10 text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email" className="text-xs font-semibold">Correo Electrónico</Label>
              <Input id="user-email" defaultValue={user.email} className="h-10 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-role" className="text-xs font-semibold">Rol Asignado</Label>
                <Select defaultValue={user.role}>
                  <SelectTrigger id="user-role" className="w-full h-10 text-xs">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="candidate">Candidato</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-status" className="text-xs font-semibold">Estado de Cuenta</Label>
                <Select defaultValue={user.status === "Verified" ? "Activo" : user.status}>
                  <SelectTrigger id="user-status" className="w-full h-10 text-xs">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter className="px-0 pt-4 flex flex-row gap-2">
          <Button
            className="h-10 px-4 font-semibold text-xs flex-1"
            onClick={() => toast.success("Perfil de usuario actualizado correctamente")}
          >
            Guardar Cambios
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-10 px-4 font-semibold text-xs">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
