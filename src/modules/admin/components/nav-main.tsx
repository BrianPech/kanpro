"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
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
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive =
              item.url !== "#" &&
              (pathname === item.url ||
                (item.url !== "/dashboard/admin" && pathname.startsWith(item.url)));

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} />}
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-10 rounded-xl px-3 gap-3 text-sm font-semibold transition-all hover:bg-muted",
                    isActive &&
                      "bg-primary/10 text-primary font-bold hover:bg-primary/15 hover:text-primary dark:bg-primary/20"
                  )}
                >
                  {item.icon}
                  <span className="text-sm">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
