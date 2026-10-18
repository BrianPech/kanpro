"use client";

import * as React from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Pipette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Encabezado semántico para accesibilidad */}
      <h1 className="sr-only">Áreas & Departamentos</h1>

      {/* Sugerencias Rápidas con 1 clic (si quedan sugerencias disponibles) */}
      {availableSuggestions.length > 0 && (
        <div className="p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              Sugerencias rápidas para tu empresa:
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              (Haz clic para agregarla instantáneamente a tu catálogo)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isAddingPreset === suggestion}
                onClick={() => handleAddPreset(suggestion)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-background border border-border/70 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50"
              >
                <span>+</span>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Contador */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="h-10 pl-9 pr-8 rounded-xl bg-card border-border/70 text-xs sm:text-sm font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-md"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-semibold">
          {filteredDepartments.length} de {departments.length} área(s)
        </span>
      </div>

      {/* 5. Listado de Áreas (Grid) */}
      {filteredDepartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: dept.color || "#6366f1" }}
                    />
                    <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {dept.name}
                    </h3>
                  </div>

                  {/* Acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="rounded-xl w-36">
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(dept)}
                        className="text-xs font-semibold gap-2 cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeletingDept(dept);
                          setIsDeleteOpen(true);
                        }}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 gap-2 cursor-pointer focus:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Descripción */}
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {dept.description || "Área operativa sin descripción detallada."}
                </p>
              </div>

              {/* Footer de la tarjeta con recuento y enlace directo */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md border-border/60 bg-muted/40 text-foreground"
                  >
                    <Users className="size-3 mr-1 text-muted-foreground" />
                    {dept.employee_count} empleado(s)
                  </Badge>
                </div>

                <Link
                  href={`/dashboard/company/employees?category=${encodeURIComponent(
                    dept.name
                  )}`}
                  className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                >
                  <span>Ver plantilla</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-border/80 bg-card text-center space-y-4">
          <div className="size-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            <Layers className="size-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              {searchQuery ? "Sin coincidencias" : "No tienes áreas registradas"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
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
                className="rounded-xl font-bold text-xs h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                <Plus className="size-4 mr-1.5" />
                <span>Crear mi primera área</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR ÁREA                                                         */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
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
                className="h-10 rounded-xl bg-background border-border/70 text-xs sm:text-sm font-medium"
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
                className="min-h-[80px] rounded-xl bg-background border-border/70 text-xs sm:text-sm font-medium resize-none"
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
                className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
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
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
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
                className="h-10 rounded-xl bg-background border-border/70 text-xs sm:text-sm font-medium"
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
                className="min-h-[80px] rounded-xl bg-background border-border/70 text-xs sm:text-sm font-medium resize-none"
                maxLength={250}
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border/40 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdating}
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="rounded-xl font-bold text-xs h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
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
        <AlertDialogContent className="rounded-3xl max-w-md p-6">
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
              className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            {deletingDept && deletingDept.employee_count === 0 && (
              <AlertDialogAction
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl font-bold text-xs h-10 bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
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
