"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Pipette,
} from "@/components/ui/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Note01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createPresetDepartmentsAction,
} from "../../actions/areas";
import type { DepartmentWithStats } from "../../services/company-areas";

const COLOR_PALETTE = [
  { hex: "#6366f1", label: "Índigo" },
  { hex: "#3b82f6", label: "Azul" },
  { hex: "#10b981", label: "Esmeralda" },
  { hex: "#f59e0b", label: "Ámbar" },
  { hex: "#ef4444", label: "Rojo" },
  { hex: "#8b5cf6", label: "Morado" },
  { hex: "#06b6d4", label: "Cian" },
  { hex: "#ec4899", label: "Rosa" },
  { hex: "#64748b", label: "Gris" },
];

const PRESET_SUGGESTIONS = [
  "Operaciones",
  "Ventas & Mostrador",
  "Administración & Finanzas",
  "Cocina & Alimentos",
  "Mantenimiento & Limpieza",
  "Recursos Humanos",
  "Almacén & Logística",
  "Atención a Clientes",
  "Sistemas & TI",
];

interface AreaColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  label?: string;
}

function AreaColorPicker({
  color,
  onChange,
  label = "Color Distintivo",
}: AreaColorPickerProps) {
  const isPreset = COLOR_PALETTE.some(
    (c) => c.hex.toLowerCase() === color.toLowerCase()
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold block">{label}</Label>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wide">
          {color}
        </span>
      </div>
      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
        {COLOR_PALETTE.map((c) => {
          const isSelected = color.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => onChange(c.hex)}
              className={cn(
                "size-7 rounded-full transition-transform cursor-pointer flex items-center justify-center shrink-0",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 scale-110"
                  : "hover:scale-105 opacity-80 hover:opacity-100"
              )}
              style={{ backgroundColor: c.hex }}
            >
              {isSelected && (
                <CheckCircle2 className="size-4 text-white drop-shadow-xs" />
              )}
            </button>
          );
        })}

        {/* Separador vertical sutil */}
        <span className="w-px h-5 bg-border/60 mx-0.5" />

        {/* Selector con Rueda Cromática Personalizada */}
        <label
          title="Rueda cromática (Color personalizado)"
          className={cn(
            "relative size-7 rounded-full transition-transform cursor-pointer flex items-center justify-center shadow-2xs group shrink-0",
            !isPreset
              ? "ring-2 ring-primary ring-offset-2 scale-110"
              : "hover:scale-105 opacity-90 hover:opacity-100"
          )}
          style={{
            background:
              "conic-gradient(from 90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff, #ff0000)",
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
            aria-label="Seleccionar color personalizado con rueda cromática"
          />
          {!isPreset ? (
            <span
              className="size-5 rounded-full flex items-center justify-center border border-white/60 shadow-xs"
              style={{ backgroundColor: color }}
            >
              <CheckCircle2 className="size-3.5 text-white drop-shadow-xs" />
            </span>
          ) : (
            <span className="size-4 rounded-full bg-background/85 flex items-center justify-center text-foreground group-hover:bg-background transition-colors shadow-2xs">
              <Pipette className="size-2.5 text-foreground/80" />
            </span>
          )}
        </label>
      </div>
    </div>
  );
}

interface CompanyAreasViewProps {
  initialDepartments: DepartmentWithStats[];
}

export function CompanyAreasView({
  initialDepartments = [],
}: CompanyAreasViewProps) {
  const [departments, setDepartments] =
    React.useState<DepartmentWithStats[]>(initialDepartments);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Sync state if server re-renders
  React.useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  // Escuchar evento del botón "+ Nueva Área" en el Topbar del layout
  React.useEffect(() => {
    const handleOpenModal = () => setIsCreateOpen(true);
    window.addEventListener("open-create-area-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-create-area-modal", handleOpenModal);
    };
  }, []);

  // Modal Crear
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createColor, setCreateColor] = React.useState(COLOR_PALETTE[0].hex);
  const [isCreating, setIsCreating] = React.useState(false);

  // Modal Editar
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingDept, setEditingDept] =
    React.useState<DepartmentWithStats | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editColor, setEditColor] = React.useState(COLOR_PALETTE[0].hex);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Modal Eliminar
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingDept, setDeletingDept] =
    React.useState<DepartmentWithStats | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Loading presets
  const [isAddingPreset, setIsAddingPreset] = React.useState<string | null>(
    null
  );

  // Filtrado
  const filteredDepartments = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  // Handler: Crear Área
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toast.error("Nombre requerido", {
        description: "Ingresa el nombre del área o departamento.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await createDepartmentAction({
        name: createName.trim(),
        description: createDescription.trim(),
        color: createColor,
      });

      if (!res.success) {
        toast.error("Error al crear área", { description: res.error });
        return;
      }

      toast.success("Área creada", {
        description: `El área "${res.data.name}" se registró correctamente.`,
      });

      const newDeptWithStats: DepartmentWithStats = {
        ...res.data,
        employee_count: 0,
      };

      setDepartments((prev) =>
        [...prev, newDeptWithStats].sort((a, b) => a.name.localeCompare(b.name))
      );

      // Limpiar y cerrar
      setCreateName("");
      setCreateDescription("");
      setCreateColor(COLOR_PALETTE[0].hex);
      setIsCreateOpen(false);
    } catch {
      toast.error("Error inesperado", {
        description: "No se pudo registrar el área.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handler: Abrir modal edición
  const handleOpenEdit = (dept: DepartmentWithStats) => {
    setEditingDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description || "");
    setEditColor(dept.color || COLOR_PALETTE[0].hex);
    setIsEditOpen(true);
  };

  // Handler: Actualizar Área
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!editName.trim()) {
      toast.error("Nombre requerido", {
        description: "El nombre no puede estar vacío.",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateDepartmentAction({
        id: editingDept.id,
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor,
      });

      if (!res.success) {
        toast.error("Error al actualizar", { description: res.error });
        return;
      }

      toast.success("Área actualizada", {
        description: `Los cambios en "${res.data.name}" se guardaron exitosamente.`,
      });

      setDepartments((prev) =>
        prev
          .map((d) =>
            d.id === editingDept.id
              ? {
                  ...res.data,
                  employee_count: editingDept.employee_count,
                }
              : d
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setIsEditOpen(false);
      setEditingDept(null);
    } catch {
      toast.error("Error inesperado", {
        description: "No se pudo actualizar el área.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler: Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;

    setIsDeleting(true);
    try {
      const res = await deleteDepartmentAction({ id: deletingDept.id });
      if (!res.success) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }

      toast.success("Área eliminada", {
        description: `El área "${res.data.deletedName}" fue removida del sistema.`,
      });

      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      setIsDeleteOpen(false);
      setDeletingDept(null);
    } catch {
      toast.error("Error inesperado al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Añadir preset con 1 clic
  const handleAddPreset = async (presetName: string) => {
    setIsAddingPreset(presetName);
    try {
      const res = await createPresetDepartmentsAction({
        names: [presetName],
      });

      if (!res.success) {
        toast.error("Aviso", { description: res.error });
        return;
      }

      if (res.data.length === 0) {
        toast.info("Ya registrada", {
          description: `El área "${presetName}" ya existe en tu catálogo.`,
        });
        return;
      }

      const createdItem = res.data[0];
      toast.success("Área agregada", {
        description: `Se añadió "${createdItem.name}" a tus departamentos.`,
      });

      setDepartments((prev) =>
        [...prev, { ...createdItem, employee_count: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
    } catch {
      toast.error("Error al registrar área sugerida");
    } finally {
      setIsAddingPreset(null);
    }
  };

  // Nombres existentes para filtrar sugerencias que ya están registradas
  const existingNamesSet = React.useMemo(() => {
    return new Set(departments.map((d) => d.name.trim().toLowerCase()));
  }, [departments]);

  const availableSuggestions = React.useMemo(() => {
    return PRESET_SUGGESTIONS.filter(
      (s) => !existingNamesSet.has(s.trim().toLowerCase())
    );
  }, [existingNamesSet]);

  return (
    <div className="flex flex-col gap-[24px] w-full pb-12 font-sans animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px]">
        <div>
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            Áreas
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[4px]">
            Organiza los departamentos de tu empresa y consulta quién pertenece a cada uno.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-medium leading-[20px] gap-[8px] cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-[16px]" />
          <span>Nueva área</span>
        </Button>
      </div>

      {/* Search Card */}
      <div className="bg-card border border-border rounded-[16px] p-[16px] sm:p-[20px]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[12px]">
          <div className="flex flex-col gap-[6px] flex-1 max-w-[480px]">
            <label
              htmlFor="areas-search-input"
              className="text-[14px] font-medium leading-[20px] text-foreground"
            >
              Buscar áreas
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 size-[16px] text-muted-foreground" />
              <Input
                id="areas-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por nombre o descripción"
                className="h-[44px] pl-[36px] pr-[36px] rounded-[8px] border-input bg-card text-[14px] font-normal placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-[16px]" />
                </button>
              )}
            </div>
          </div>

          <span className="text-[14px] font-normal leading-[20px] text-muted-foreground shrink-0 self-start sm:self-center tabular-nums">
            {filteredDepartments.length} de {departments.length}{" "}
            {departments.length === 1 ? "área" : "áreas"}
          </span>
        </div>
      </div>

      {/* Areas Table Card */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        {filteredDepartments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-muted/30 border-b border-border">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="h-[44px] px-[20px] text-[12px] font-medium leading-[16px] text-muted-foreground">
                    Área
                  </TableHead>
                  <TableHead className="h-[44px] px-[16px] text-[12px] font-medium leading-[16px] text-muted-foreground text-right">
                    Colaboradores
                  </TableHead>
                  <TableHead className="h-[44px] w-[96px] px-[20px] text-[12px] font-medium leading-[16px] text-muted-foreground text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((dept) => (
                  <TableRow
                    key={dept.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="px-[20px] py-[14px] align-middle">
                      <Link
                        href={`/dashboard/company/employees?category=${encodeURIComponent(
                          dept.name
                        )}&from=areas`}
                        className="flex items-center gap-[12px] group min-w-[220px]"
                      >
                        <span
                          className="size-[8px] rounded-full shrink-0"
                          style={{ backgroundColor: dept.color || "#6366f1" }}
                        />
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold leading-[20px] text-link group-hover:underline truncate">
                            {dept.name}
                          </p>
                          <p className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                            {dept.description || "Área operativa sin descripción detallada."}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="px-[16px] py-[14px] align-middle text-right">
                      <span className="text-[14px] font-semibold leading-[20px] text-foreground tabular-nums">
                        {dept.employee_count}
                      </span>
                    </TableCell>

                    <TableCell className="px-[20px] py-[14px] align-middle text-right">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Acciones para ${dept.name}`}
                                className="size-[36px] rounded-[8px] bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                              >
                                <MoreHorizontal className="size-[16px]" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent
                            align="end"
                            className="w-44 rounded-[12px] border-border bg-popover shadow-lg p-1"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(dept)}
                              className="text-[14px] font-normal py-[8px] px-[10px] rounded-[8px] gap-[8px] cursor-pointer"
                            >
                              <Pencil className="size-[15px] text-muted-foreground" />
                              <span>Editar área</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingDept(dept);
                                setIsDeleteOpen(true);
                              }}
                              className="text-[14px] font-normal py-[8px] px-[10px] rounded-[8px] gap-[8px] text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="size-[15px]" />
                              <span>Eliminar área</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card className="p-8 sm:p-12 border-0 rounded-none text-center space-y-4 shadow-none">
            <div className="size-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <Layers className="size-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-foreground">
                {searchQuery ? "Sin coincidencias" : "No tienes áreas registradas"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? `No encontramos áreas que coincidan con "${searchQuery}". Intenta con otro término.`
                  : "Comienza a estructurar tu empresa agregando áreas operativas como Operaciones, Ventas, Cocina, etc."}
              </p>
            </div>
            {!searchQuery && (
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  size="sm"
                  className="font-medium cursor-pointer"
                >
                  <Plus className="size-4 mr-1.5" />
                  <span>Crear mi primera área</span>
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Suggested Areas Card */}
      {availableSuggestions.length > 0 && (
        <div className="bg-card border border-border rounded-[16px] p-[16px] sm:p-[20px] flex flex-col gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <HugeiconsIcon
              icon={Note01Icon}
              className="size-[16px] text-link shrink-0"
              strokeWidth={1.8}
            />
            <h3 className="text-[16px] font-semibold leading-[24px] text-foreground">
              Áreas sugeridas
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            {availableSuggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isAddingPreset === suggestion}
                onClick={() => handleAddPreset(suggestion)}
                className="h-[36px] px-[14px] rounded-[8px] border border-control-border bg-card hover:bg-muted/50 text-[14px] font-medium leading-[20px] text-foreground inline-flex items-center gap-[8px] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="size-[14px] text-muted-foreground" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR ÁREA                                                         */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Nueva Área o Departamento
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Registra un área interna real de tu empresa.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="create_name" className="text-xs font-semibold">
                Nombre del Área <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="create_name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ej. Cocina Caliente, Mostrador, Almacén General..."
                required
              />
            </div>

            {/* Paleta de Color con Rueda Cromática */}
            <AreaColorPicker
              color={createColor}
              onChange={setCreateColor}
              label="Color Distintivo del Área"
            />

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="create_desc" className="text-xs font-semibold">
                Descripción Operativa (Opcional)
              </Label>
              <Textarea
                id="create_desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Funciones principales, turnos o alcance de este departamento..."
                className="min-h-[80px] resize-none"
                maxLength={250}
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                {createDescription.length}/250
              </span>
            </div>

            <DialogFooter className="pt-2 border-t border-border/40 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => setIsCreateOpen(false)}
                className="font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="font-bold text-xs px-5 cursor-pointer"
              >
                {isCreating ? "Guardando..." : "Guardar Área"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ÁREA                                                        */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
            <DialogTitle className="text-lg font-bold">
              Editar Área o Departamento
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica el nombre o la información de esta área. Si cambias el nombre, se actualizará automáticamente en los colaboradores asignados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSubmit} className="space-y-4 pt-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_name" className="text-xs font-semibold">
                Nombre del Área <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="edit_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            {/* Paleta de Color con Rueda Cromática */}
            <AreaColorPicker
              color={editColor}
              onChange={setEditColor}
              label="Color Distintivo"
            />

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="edit_desc" className="text-xs font-semibold">
                Descripción Operativa
              </Label>
              <Textarea
                id="edit_desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={250}
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border/40 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => setIsEditOpen(false)}
                className="font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="font-bold text-xs px-5 cursor-pointer"
              >
                {isUpdating ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* ALERT DIALOG: ELIMINAR ÁREA                                              */}
      {/* ========================================================================= */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-md p-6">
          <AlertDialogHeader className="space-y-2">
            <div className="size-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-lg font-bold">
              ¿Eliminar área "{deletingDept?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {deletingDept && deletingDept.employee_count > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold block">
                  Esta área tiene {deletingDept.employee_count} empleado(s) activo(s) asignado(s). No es posible eliminarla hasta que los colaboradores sean reasignados a otra área.
                </span>
              ) : (
                "Esta acción removerá el departamento de tu catálogo de áreas de forma permanente."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t border-border/40 gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            {deletingDept && deletingDept.employee_count === 0 && (
              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
              >
                {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
