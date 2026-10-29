"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  SparklesIcon,
  PhoneIcon,
  HelpCircleIcon,
  FileTextIcon,
  CoinsIcon,
  KeyRoundIcon,
} from "@/components/ui/icons";

const SUPPORT_WHATSAPP_NUMBER = "529991234567";

const TOPIC_PRESETS = [
  {
    label: "Duda General",
    icon: <HelpCircleIcon className="size-3.5 text-emerald-600" />,
    text: "Hola Soporte K'anPro, quisiera hacer una consulta general sobre la plataforma.",
  },
  {
    label: "Publicar / Ver Vacantes",
    icon: <FileTextIcon className="size-3.5 text-blue-600" />,
    text: "Hola Soporte K'anPro, requiero asistencia con la publicación de una vacante.",
  },
  {
    label: "Créditos de Empresa",
    icon: <CoinsIcon className="size-3.5 text-amber-600" />,
    text: "Hola equipo de K'anPro, deseo consultar información sobre paquetes de créditos para empresas.",
  },
  {
    label: "Acceso a Mi Cuenta",
    icon: <KeyRoundIcon className="size-3.5 text-purple-600" />,
    text: "Hola Soporte K'anPro, necesito ayuda para recuperar el acceso a mi cuenta.",
  },
];

export function WhatsAppSupportWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState("");

  if (pathname?.startsWith("/dashboard/admin")) {
    return null;
  }

  const handleLaunchWhatsApp = (text: string) => {
    const encodedText = encodeURIComponent(text.trim() || "Hola Soporte K'anPro, solicito asistencia.");
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodedText}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      {/* Expanded Popup Card */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl border border-emerald-500/30 bg-card shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white/40">
                  <AvatarImage src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" />
                  <AvatarFallback className="bg-emerald-800 text-white font-bold text-xs">
                    KP
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span>Soporte Técnico K’anPro</span>
                  <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-[10px] px-1.5 py-0">
                    Mérida
                  </Badge>
                </div>
                <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                  En línea ahora • Respuesta inmediata por WhatsApp
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            >
              <XIcon className="size-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col gap-3 bg-muted/20 text-xs">
            {/* Greeting Callout */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-foreground flex flex-col gap-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <SparklesIcon className="size-3.5 text-emerald-600" />
                ¡Hola! 👋 Sofía de Atención K’anPro
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Selecciona una opción rápida o escribe tu mensaje para chatear directamente por WhatsApp con nuestro equipo.
              </p>
            </div>

            {/* Topic Quick Presets */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">
                ¿En qué te podemos ayudar?
              </span>
              <div className="flex flex-col gap-1.5">
                {TOPIC_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLaunchWhatsApp(preset.text)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-medium text-xs text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      {preset.icon}
                      <span>{preset.label}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      Chatear →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Bar */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
              <Input
                placeholder="Escribe tu consulta personalizada..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLaunchWhatsApp(customMessage);
                }}
                className="h-9 text-xs rounded-xl bg-card border-border/40"
              />
              <Button
                type="button"
                onClick={() => handleLaunchWhatsApp(customMessage)}
                className="h-9 bg-[#25D366] hover:bg-[#20ba5a] text-[#062c1e] font-extrabold text-xs rounded-xl gap-2 shadow-xs cursor-pointer"
              >
                <PhoneIcon className="size-3.5 fill-current" />
                <span>Abrir Chat en WhatsApp</span>
                <SendIcon className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Floating Button */}
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-13 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-[#062c1e] shadow-xl hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-[#062c1e]/20 cursor-pointer"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircleIcon className="size-6 fill-current text-[#062c1e]" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-900 animate-ping" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-extrabold tracking-tight leading-none text-[#062c1e]">Soporte WhatsApp</span>
          <span className="text-[10px] font-bold text-[#062c1e]/80 leading-none pt-0.5">Atención en vivo</span>
        </div>
      </Button>
    </div>
  );
}
