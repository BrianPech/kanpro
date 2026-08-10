"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, MailIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup className="px-2 py-1.5">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1.5">
            <SidebarMenuButton
              tooltip="Crear Rápido"
              className="h-10 min-w-8 rounded-lg bg-primary text-primary-foreground text-xs font-bold duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 px-3"
            >
              <CirclePlusIcon className="size-4 shrink-0" />
              <span>Crear Rápido</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-10 rounded-lg group-data-[collapsible=icon]:opacity-0 border-border/20 shrink-0"
              variant="outline"
            >
              <MailIcon className="size-4" />
              <span className="sr-only">Bandeja</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="gap-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className="h-10 rounded-lg px-3 gap-3 text-sm font-semibold transition-all hover:bg-muted"
              >
                {item.icon}
                <span className="text-sm font-semibold">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
