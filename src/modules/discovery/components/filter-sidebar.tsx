"use client";

import * as React from "react";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterState {
  search: string;
  types: string[];
  salary: [number, number];
  categories: string[];
  locations: string[];
  experience: string[];
}

interface FilterSidebarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  mode: "jobs" | "professionals";
  className?: string;
  hideSearch?: boolean;
}

const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance"];
const categories = ["Design", "Development", "Marketing", "Finance", "Data"];
const locations = ["Remote", "San Francisco", "New York", "London", "Berlin", "Austin", "Seattle", "Mexico City", "Barcelona"];
const experienceLevels = ["Junior", "Mid", "Senior", "Lead"];

export function FilterSidebar({
  filter,
  onChange,
  mode,
  className,
  hideSearch = false,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filter.types.length > 0 ||
    filter.salary[0] > 30 ||
    filter.salary[1] < 250 ||
    filter.categories.length > 0 ||
    filter.locations.length > 0 ||
    filter.experience.length > 0;

  const clearAll = () => {
    onChange({
      ...filter,
      types: [],
      salary: [30, 250],
      categories: [],
      locations: [],
      experience: [],
    });
  };

  const toggleItem = (list: string[], item: string) => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    } else {
      return [...list, item];
    }
  };

  return (
    <aside className={cn("w-full px-5 space-y-6 select-none", className)}>
      
      {/* Title & Clear All */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <h2 className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filtros Avanzados
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-bright transition-colors"
          >
            <RotateCcw className="size-3" />
            Limpiar todo
          </button>
        )}
      </div>

      {/* Conditional Search (if not hidden) */}
      {!hideSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar..."
            value={filter.search}
            onChange={(e) => onChange({ ...filter, search: e.target.value })}
            className="h-10 rounded-xl border-border bg-white pl-9 text-xs text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      )}

      {/* Salary Range Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/75">
            {mode === "jobs" ? "Rango Salarial" : "Rango de Tarifa"}
          </h3>
          <span className="text-xs font-extrabold text-primary">
            {mode === "jobs"
              ? `$${filter.salary[0]}k – $${filter.salary[1]}k`
              : `$${filter.salary[0]}/hr – $${filter.salary[1]}/hr`}
          </span>
        </div>
        <Slider
          value={filter.salary}
          onValueChange={(value) =>
            onChange({ ...filter, salary: value as [number, number] })
          }
          min={0}
          max={300}
          step={5}
          className="py-2"
        />
        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground/85">
          <span>{mode === "jobs" ? "$0k USD" : "$0/hr"}</span>
          <span>{mode === "jobs" ? "$300k+ USD" : "$300/hr"}</span>
        </div>
      </div>

      {/* Job Type (Full-time, contract...) */}
      {mode === "jobs" && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/75">Jornada</h3>
          <div className="flex flex-wrap gap-1.5">
            {jobTypes.map((type) => {
              const isSelected = filter.types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...filter, types: toggleItem(filter.types, type) })}
                  className={cn(
                    "h-8 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground shadow-xs font-bold"
                      : "bg-white dark:bg-zinc-900 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/75">Categorías</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const isSelected = filter.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => onChange({ ...filter, categories: toggleItem(filter.categories, category) })}
                className={cn(
                  "h-8 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-white dark:bg-zinc-900 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/75">Ubicaciones</h3>
        <div className="flex flex-wrap gap-1.5">
          {locations.map((loc) => {
            const isSelected = filter.locations.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => onChange({ ...filter, locations: toggleItem(filter.locations, loc) })}
                className={cn(
                  "h-8 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-white dark:bg-zinc-900 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience */}
      {mode === "jobs" && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/75">Seniority</h3>
          <div className="flex flex-wrap gap-1.5">
            {experienceLevels.map((level) => {
              const isSelected = filter.experience.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ ...filter, experience: toggleItem(filter.experience, level) })}
                  className={cn(
                    "h-8 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground shadow-xs font-bold"
                      : "bg-white dark:bg-zinc-900 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
