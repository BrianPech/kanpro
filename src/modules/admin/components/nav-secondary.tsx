"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { AdminCommandPalette } from "@/modules/admin/components/admin-command-palette"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false)

  return (
    <>
      <SidebarGroup className="px-2 py-1" {...props}>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {items.map((item) => {
              const isSearch =
                item.title.toLowerCase() === "search" ||
                item.title.toLowerCase() === "buscar"

              const isActive = item.url !== "#" && pathname === item.url

              if (isSearch) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => setCommandPaletteOpen(true)}
                      className="h-9.5 rounded-lg px-3 gap-2.5 text-sm font-semibold hover:bg-muted cursor-pointer"
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.title}</span>
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                      </KbdGroup>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "h-9.5 rounded-lg px-3 gap-2.5 text-sm font-semibold hover:bg-muted",
                      isActive &&
                        "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
                    )}
                  >
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AdminCommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </>
  )
}
