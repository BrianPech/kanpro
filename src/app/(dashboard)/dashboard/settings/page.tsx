"use client";

import * as React from "react";
import {
  Settings as SettingsIcon,
  Search,
  User,
  Edit3,
  FileText,
  Calendar,
  MessageSquare,
  Palette,
  Share2,
  Blocks,
  Bell,
  Briefcase,
  HelpCircle,
  LogOut,
  Image as ImageIcon,
  Star,
  DollarSign,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("themes");

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Settings Left Navigation */}
      <div className="w-[280px] flex-shrink-0 border-r border-border/50 flex flex-col h-full bg-background">
        <div className="h-[80px] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-foreground" />
            <span className="text-[20px] font-semibold tracking-tight">
              Configuración
            </span>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8 custom-scrollbar">
          {/* PROFILE SECTION */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-4 mb-2">
              Perfil
            </span>
            <NavButton
              icon={<User />}
              label="General"
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
            <NavButton
              icon={<Edit3 />}
              label="Editar Perfil"
              isActive={activeTab === "edit"}
              onClick={() => setActiveTab("edit")}
            />
            <NavButton
              icon={<FileText />}
              label="Documentos"
              isActive={activeTab === "docs"}
              onClick={() => setActiveTab("docs")}
            />
            <NavButton
              icon={<Calendar />}
              label="Calendario"
              isActive={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
            />
          </div>

          {/* PREFERENCES SECTION */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-4 mb-2">
              Preferencias
            </span>
            <NavButton
              icon={<MessageSquare />}
              label="Mensajes y Medios"
              isActive={activeTab === "messages"}
              onClick={() => setActiveTab("messages")}
            />
            <NavButton
              icon={<Palette />}
              label="Temas"
              isActive={activeTab === "themes"}
              onClick={() => setActiveTab("themes")}
            />
          </div>

          {/* APPS SECTION */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-4 mb-2">
              Aplicaciones
            </span>
            <NavButton
              icon={<Share2 />}
              label="Redes Sociales"
              isActive={activeTab === "social"}
              onClick={() => setActiveTab("social")}
            />
            <NavButton
              icon={<Blocks />}
              label="Integraciones"
              isActive={activeTab === "integrations"}
              onClick={() => setActiveTab("integrations")}
            />
          </div>

          {/* NOTIFICATION SECTION */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-4 mb-2">
              Notificaciones
            </span>
            <NavButton
              icon={<Bell />}
              label="Personales"
              isActive={activeTab === "notif_personal"}
              onClick={() => setActiveTab("notif_personal")}
            />
            <NavButton
              icon={<Briefcase />}
              label="Workspace"
              isActive={activeTab === "notif_workspace"}
              onClick={() => setActiveTab("notif_workspace")}
            />
          </div>
        </div>

        <div className="p-4 border-t border-border/50 flex flex-col gap-1">
          <NavButton icon={<HelpCircle />} label="Centro de Ayuda" />
          <NavButton
            icon={<LogOut />}
            label="Cerrar Sesión"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-card/20 border-t border-l border-border/50 rounded-tl-[24px] p-8 md:p-12">
        <div className="max-w-[800px] mx-auto flex flex-col gap-12">
          {/* THEMES HEADER */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-semibold tracking-tight">
              Seleccionar Tema
            </h2>
            <p className="text-[15px] text-muted-foreground">
              Personaliza tu espacio de trabajo para que sea más cómodo y
              agradable a la vista.
            </p>
          </div>

          {/* THEME CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ThemeCard
              name="Sistema (Tema Claro)"
              isActive={true}
              mockup={
                <div className="w-full h-full bg-white rounded-t-[12px] p-4 flex flex-col gap-3 shadow-sm border-b border-border/10">
                  {/* Mockup Header */}
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-3 bg-primary rounded-[4px]"></div>
                    <div className="w-3 h-3 bg-primary/20 rounded-full ml-auto"></div>
                  </div>
                  {/* Mockup Body */}
                  <div className="flex gap-3 h-full">
                    <div className="w-[30%] flex flex-col gap-2">
                      <div className="w-full h-2 bg-gray-200 rounded-full"></div>
                      <div className="w-[80%] h-2 bg-gray-200 rounded-full"></div>
                      <div className="w-[90%] h-2 bg-gray-200 rounded-full"></div>
                      <div className="w-[60%] h-2 bg-gray-200 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 border border-gray-100 rounded-[6px]"></div>
                  </div>
                </div>
              }
            />
            <ThemeCard
              name="Sistema (Tema Oscuro)"
              isActive={false}
              mockup={
                <div className="w-full h-full bg-neutral-900 rounded-t-[12px] p-4 flex flex-col gap-3 shadow-sm border-b border-border/10">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-3 bg-primary rounded-[4px]"></div>
                    <div className="w-3 h-3 bg-primary/40 rounded-full ml-auto"></div>
                  </div>
                  <div className="flex gap-3 h-full">
                    <div className="w-[30%] flex flex-col gap-2">
                      <div className="w-full h-2 bg-neutral-700 rounded-full"></div>
                      <div className="w-[80%] h-2 bg-neutral-700 rounded-full"></div>
                      <div className="w-[90%] h-2 bg-neutral-700 rounded-full"></div>
                      <div className="w-[60%] h-2 bg-neutral-700 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 bg-neutral-800 border border-neutral-700 rounded-[6px]"></div>
                  </div>
                </div>
              }
            />
            <ThemeCard
              name="Cosmic Soft Blue"
              isActive={false}
              mockup={
                <div className="w-full h-full bg-slate-50 rounded-t-[12px] p-4 flex flex-col gap-3 shadow-sm border-b border-border/10">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-3 bg-[#007bc2] rounded-[4px]"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded-full ml-auto"></div>
                  </div>
                  <div className="flex gap-3 h-full">
                    <div className="w-[30%] flex flex-col gap-2">
                      <div className="w-full h-2 bg-blue-200/50 rounded-full"></div>
                      <div className="w-[80%] h-2 bg-blue-200/50 rounded-full"></div>
                      <div className="w-[90%] h-2 bg-blue-200/50 rounded-full"></div>
                      <div className="w-[60%] h-2 bg-blue-200/50 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-[6px]"></div>
                  </div>
                </div>
              }
            />
          </div>

          <div className="w-full h-[1px] bg-border/60 my-2"></div>

          {/* APPS & INTEGRATIONS */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-[20px] font-semibold tracking-tight">
                Apps & Integraciones
              </h2>
              <p className="text-[14px] text-muted-foreground">
                Mejora la comunicación y productividad conectando tus redes
                sociales, Slack y GitHub.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                Redes Sociales
              </span>

              <IntegrationRow
                icon={<LinkedinIcon className="w-5 h-5 text-[#0A66C2]" />}
                name="Conectar cuenta de LinkedIn"
                status="unconnected"
              />
              <IntegrationRow
                icon={<Briefcase className="w-5 h-5 text-foreground" />}
                name="Conectar cuenta de Indeed"
                status="unconnected"
              />
              <IntegrationRow
                icon={<TwitterIcon className="w-5 h-5 text-[#1DA1F2]" />}
                name="@JuanPerez_Dev"
                status="connected"
              />
            </div>

            <div className="flex flex-col gap-4 mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                Integraciones de Software
              </span>

              <IntegrationRow
                icon={<GithubIcon className="w-5 h-5 text-foreground" />}
                name="JuanPerez Github"
                status="connected"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick, className = "" }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full h-[44px] px-4 rounded-[12px] text-[14px] font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/10 hover:text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      } ${className}`}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {React.cloneElement(icon, { className: "w-[18px] h-[18px]" })}
      </span>
      {label}
    </button>
  );
}

function ThemeCard({ name, isActive, mockup }: any) {
  return (
    <div
      className={`flex flex-col border rounded-[16px] overflow-hidden cursor-pointer transition-all duration-300 ${
        isActive
          ? "border-primary ring-1 ring-primary shadow-md"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="h-[140px] w-full bg-muted/30 p-4 pb-0 flex items-end justify-center overflow-hidden">
        <div className="w-[90%] h-[90%] mx-auto">{mockup}</div>
      </div>
      <div className="h-[56px] bg-card flex items-center px-4 gap-3 border-t border-border/50">
        <div
          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            isActive ? "border-primary" : "border-muted-foreground/40"
          }`}
        >
          {isActive && <div className="w-2 h-2 rounded-full bg-primary"></div>}
        </div>
        <span
          className={`text-[14px] ${isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

function IntegrationRow({ icon, name, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-[16px] border border-border/60 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[15px] font-medium text-foreground">{name}</span>
      </div>
      {status === "unconnected" ? (
        <Button className="h-[36px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-[13px] font-medium">
          Conectar <span className="ml-1">→</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          className="h-[36px] rounded-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive px-6 text-[13px] font-medium"
        >
          Desconectar <span className="ml-2">✕</span>
        </Button>
      )}
    </div>
  );
}

export function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
      <rect x="2" y="9" width="4" height="12"></rect>
      <circle cx="4" cy="4" r="2"></circle>
    </svg>
  );
}

export function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
    </svg>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
    </svg>
  );
}
