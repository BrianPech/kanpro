"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageCircleIcon,
  PhoneIcon,
  ExternalLinkIcon,
  CopyIcon,
  SparklesIcon,
  CheckIcon,
} from "lucide-react";

const SUPPORT_PHONE = "+52 999 123 4567";
const SUPPORT_PHONE_RAW = "529991234567";

export function WhatsAppHubCard() {
  const [copied, setCopied] = React.useState(false);
  const [customPhone, setCustomPhone] = React.useState("");
  const [customMsg, setCustomMsg] = React.useState("");

  const directLink = `https://wa.me/${SUPPORT_PHONE_RAW}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopied(true);
    toast.success("Enlace de WhatsApp de soporte copiado al portapapeles.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchWhatsApp = (phone: string, msg: string) => {
    const raw = phone.replace(/[^0-9]/g, "") || SUPPORT_PHONE_RAW;
    const text = encodeURIComponent(msg || "Hola, le contactamos del equipo de Soporte K'anPro.");
    window.open(`https://web.whatsapp.com/send?phone=${raw}&text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-500/5 border-b border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#25D366] text-white shadow-xs">
            <MessageCircleIcon className="size-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Central de Atención WhatsApp Hub</span>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px] px-2 py-0">
                Canal Principal
              </Badge>
            </CardTitle>

          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Number Overview */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/30 bg-card">
            <span className="text-[11px] font-semibold text-muted-foreground">Número Oficial de Soporte:</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-foreground font-mono flex items-center gap-2">
                <PhoneIcon className="size-4 text-emerald-600" />
                {SUPPORT_PHONE}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-xs font-semibold gap-1 border-border/40"
              >
                {copied ? <CheckIcon className="size-3.5 text-green-600" /> : <CopyIcon className="size-3.5" />}
                <span>{copied ? "Copiado" : "Copiar Enlace"}</span>
              </Button>
            </div>
            <a
              href={directLink}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs transition-colors shadow-xs"
            >
              <MessageCircleIcon className="size-4 fill-current" />
              <span>Abrir WhatsApp Web de Soporte</span>
              <ExternalLinkIcon className="size-3.5 opacity-80" />
            </a>
          </div>

          {/* Right Column: Direct Quick Contact Launcher */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/30 bg-card">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <SparklesIcon className="size-3.5 text-purple-500" />
              Enviar Mensaje Exprés a Usuario:
            </span>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Teléfono (Ej. +52 999 123 4567)"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
              <Input
                placeholder="Mensaje de respuesta rápida..."
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
              <Button
                size="sm"
                onClick={() => handleLaunchWhatsApp(customPhone, customMsg)}
                className="h-8 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg gap-1.5"
              >
                <MessageCircleIcon className="size-3.5 fill-current" />
                <span>Lanzar Conversación en WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
