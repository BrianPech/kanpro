"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle({
  className,
}: {
  className?: string;
}) {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className || "h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"}
            aria-label="Cambiar tema"
          />
        }
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Cambiar tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl min-w-32">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="text-xs font-semibold cursor-pointer flex items-center gap-2"
        >
          <Sun className="size-3.5 text-amber-500" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="text-xs font-semibold cursor-pointer flex items-center gap-2"
        >
          <Moon className="size-3.5 text-blue-500" />
          <span>Oscuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="text-xs font-semibold cursor-pointer flex items-center gap-2"
        >
          <Laptop className="size-3.5 text-muted-foreground" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
