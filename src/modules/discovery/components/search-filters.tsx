"use client";

import * as React from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  modality: string;
  onModalityChange: (val: string) => void;
  location: string;
  onLocationChange: (val: string) => void;
  categories: string[];
  locations?: string[]; // Kept for interface compatibility but unused now
  className?: string;
}

export function SearchFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  modality,
  onModalityChange,
  location,
  onLocationChange,
  categories,
  className,
}: SearchFiltersProps) {
  return (
    <div
      className={cn(
        "w-full bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-border/40 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center shadow-xs transition-all duration-300",
        className
      )}
    >
      {/* 1. Job/Title Search Input (Left area) */}
      <div className="relative w-full md:flex-1 group">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-[#494fdf] transition-colors" />
        <Input
          type="text"
          placeholder="Buscar vacantes por cargo, habilidades o empresa..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-10 pr-4 rounded-xl border-border/60 bg-white/60 dark:bg-zinc-800/40 focus-visible:ring-[#494fdf]/30 focus-visible:border-[#494fdf] text-sm placeholder:text-muted-foreground/50 transition-all w-full"
        />
      </div>

      {/* 2. Location Text Input (Middle area) */}
      <div className="relative w-full md:w-[240px] group">
        <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-[#494fdf] transition-colors" />
        <Input
          type="text"
          placeholder="Ciudad, zona o colonia..."
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="h-10 pl-10 pr-4 rounded-xl border-border/60 bg-white/60 dark:bg-zinc-800/40 focus-visible:ring-[#494fdf]/30 focus-visible:border-[#494fdf] text-sm placeholder:text-muted-foreground/50 transition-all w-full"
        />
      </div>

      {/* 3. Dropdowns Container (Right aligned) */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-start md:justify-end">
        {/* Sector / Industria */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 md:flex-initial">
          <Select value={category || "todos"} onValueChange={(val) => onCategoryChange(val === "todos" ? "" : val)}>
            <SelectTrigger className={cn(
              "h-10 px-3 py-2 text-xs font-semibold rounded-xl border border-border/60 bg-white/60 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 w-full md:w-[150px]",
              category
                ? "text-zinc-900 dark:text-zinc-50 font-bold border-blue-500/30"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}>
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-zinc-900/95 border-border/40 rounded-xl">
              <SelectItem value="todos" className="text-xs font-medium cursor-pointer rounded-lg">Sector: Todos</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs font-medium cursor-pointer rounded-lg">
                  {cat === "Design" ? "Diseño" :
                   cat === "Development" ? "Desarrollo" :
                   cat === "Marketing" ? "Marketing" :
                   cat === "Finance" ? "Finanzas" :
                   cat === "Data" ? "Datos" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modalidad */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 md:flex-initial">
          <Select value={modality || "todos"} onValueChange={(val) => onModalityChange(val === "todos" ? "" : val)}>
            <SelectTrigger className={cn(
              "h-10 px-3 py-2 text-xs font-semibold rounded-xl border border-border/60 bg-white/60 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 w-full md:w-[140px]",
              modality
                ? "text-zinc-900 dark:text-zinc-50 font-bold border-blue-500/30"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}>
              <SelectValue placeholder="Modalidad" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-zinc-900/95 border-border/40 rounded-xl">
              <SelectItem value="todos" className="text-xs font-medium cursor-pointer rounded-lg">Modalidad: Todas</SelectItem>
              <SelectItem value="Presencial" className="text-xs font-medium cursor-pointer rounded-lg">Presencial</SelectItem>
              <SelectItem value="Híbrido" className="text-xs font-medium cursor-pointer rounded-lg">Híbrido</SelectItem>
              <SelectItem value="Remoto" className="text-xs font-medium cursor-pointer rounded-lg">Remoto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
