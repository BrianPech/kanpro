"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboardIcon,
  UsersIcon,
  ChartBarIcon,
  FolderIcon,
  ListIcon,
  Settings2Icon,
  CircleHelpIcon,
  PlusIcon,
  FileChartColumnIcon,
  ShieldCheckIcon,
} from "lucide-react"

export function AdminCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = React.useCallback(
    (action: () => void) => {
      onOpenChange(false)
      action()
    },
    [onOpenChange]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Paleta de Comandos Admin"
      description="Busca secciones, herramientas y acciones en K'anPro"
    >
      <CommandInput placeholder="Escribe un comando o busca en el sistema..." />
      <CommandList className="p-3">
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        
        <CommandGroup heading="Navegación Principal">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/admin"))}
            className="cursor-pointer"
          >
            <LayoutDashboardIcon className="size-5 mr-3 text-primary" />
            <span className="text-base font-semibold">Dashboard Principal</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>D</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/admin/users"))}
            className="cursor-pointer"
          >
            <UsersIcon className="size-5 mr-3 text-primary" />
            <span className="text-base font-semibold">Usuarios Registrados</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>U</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Viendo sección de Analíticas"))}
            className="cursor-pointer"
          >
            <ChartBarIcon className="size-5 mr-3 text-muted-foreground" />
            <span className="text-base font-medium">Analíticas & Métricas</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Viendo proyectos activos"))}
            className="cursor-pointer"
          >
            <FolderIcon className="size-5 mr-3 text-muted-foreground" />
            <span className="text-base font-medium">Gestión de Proyectos</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Viendo ciclo de vida"))}
            className="cursor-pointer"
          >
            <ListIcon className="size-5 mr-3 text-muted-foreground" />
            <span className="text-base font-medium">Ciclo de Vida</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Acciones Rápidas">
          <CommandItem
            onSelect={() => runCommand(() => toast.success("Acción: Crear Rápido ejecutada"))}
            className="cursor-pointer"
          >
            <PlusIcon className="size-5 mr-3 text-emerald-500" />
            <span className="text-base font-semibold">Crear Nueva Sección / Vacante</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>N</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Generando informe de rendimiento..."))}
            className="cursor-pointer"
          >
            <FileChartColumnIcon className="size-5 mr-3 text-blue-500" />
            <span className="text-base font-medium">Generar Reporte de Rendimiento</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configuración & Ayuda">
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Ajustes del sistema"))}
            className="cursor-pointer"
          >
            <Settings2Icon className="size-5 mr-3 text-muted-foreground" />
            <span className="text-base font-medium">Configuración del Sistema</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Abriendo centro de soporte"))}
            className="cursor-pointer"
          >
            <CircleHelpIcon className="size-5 mr-3 text-muted-foreground" />
            <span className="text-base font-medium">Centro de Ayuda y Soporte</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => toast.info("Permisos de Administrador activos"))}
            className="cursor-pointer"
          >
            <ShieldCheckIcon className="size-5 mr-3 text-purple-500" />
            <span className="text-base font-medium">Ver Permisos Admin</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  )
}
