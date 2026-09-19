import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupportTicketById } from "@/app/(dashboard)/dashboard/admin/support/actions";
import { TicketWorkbenchClient } from "@/modules/admin/components/ticket-workbench";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTicketDetailPage({ params }: TicketPageProps) {
  const { id } = await params;

  // Fetch ticket data
  const ticket = await getSupportTicketById(id);

  if (!ticket) {
    redirect("/dashboard/admin/support");
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-3">
          <Button render={<Link href="/dashboard/admin/support" />} variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
            <ArrowLeftIcon className="size-3.5" />
            <span>Volver a Soporte</span>
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <span className="text-xs text-muted-foreground font-medium">
            Atención de Ticket <strong className="text-foreground font-semibold">{ticket.ticketNumber}</strong>
          </span>
        </div>
      </div>

      {/* Dedicated Full Page Workbench */}
      <div className="flex-1">
        <TicketWorkbenchClient ticket={ticket} />
      </div>
    </div>
  );
}
