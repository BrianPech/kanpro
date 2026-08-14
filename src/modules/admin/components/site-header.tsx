import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/15 bg-background/95 backdrop-blur px-4 md:px-6 transition-all rounded-t-2xl">
      <div className="flex w-full items-center gap-2.5">
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg hover:bg-muted" />
        <Separator
          orientation="vertical"
          className="mx-1 h-5 data-[orientation=vertical]:h-5"
        />
        <div>
          <h1 className="text-sm md:text-base font-bold tracking-tight text-foreground">
            Panel de Administración Central
          </h1>
        </div>
      </div>
    </header>
  )
}
