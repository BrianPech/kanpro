"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, FolderIcon, ShareIcon, Trash2Icon } from "lucide-react"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden px-2 py-1">
      <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/80 mb-1 px-2">
        Documentos & Reportes
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild className="h-9.5 rounded-lg px-3 gap-2.5 text-sm font-semibold hover:bg-muted">
              <a href={item.url}>
                {item.icon}
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="rounded-md h-7 w-7 data-[state=open]:bg-accent"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                  <span className="sr-only">Más opciones</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-32 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem className="text-xs font-medium">
                  <FolderIcon className="size-3.5 mr-2" />
                  <span>Abrir</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-medium">
                  <ShareIcon className="size-3.5 mr-2" />
                  <span>Compartir</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" className="text-xs font-medium">
                  <Trash2Icon className="size-3.5 mr-2" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="h-9.5 rounded-lg px-3 text-sm font-semibold text-sidebar-foreground/70 hover:bg-muted">
            <MoreHorizontalIcon className="size-4 text-sidebar-foreground/70" />
            <span>Ver más</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
