"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CirclePlusIcon, MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}) {
  const pathname = usePathname();

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
          {items.map((item) => {
            const isActive =
              item.url !== "#" &&
              (pathname === item.url ||
                (item.url !== "/dashboard/admin" && pathname.startsWith(item.url)));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-10 rounded-lg px-3 gap-3 text-sm font-semibold transition-all hover:bg-muted",
                    isActive &&
                      "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
                  )}
                >
                  <Link href={item.url}>
                    {item.icon}
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
