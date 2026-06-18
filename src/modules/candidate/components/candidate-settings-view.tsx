"use client";

import * as React from "react";
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  PlusCircle, 
  X,
  Check,
  AlertCircle,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCandidateProfile } from "../hooks/use-candidate-profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExperienceItem } from "../schemas/candidate.schema";

export function CandidateSettingsView() {
  const {
    form,
    isLoading,
    isSubmitting,
    skills,
    experience,
    portfolioLinks,
    skillInput,
    portfolioInput,
    setSkillInput,
    setPortfolioInput,
    addSkill,
    removeSkill,
    addPortfolioLink,
    removePortfolioLink,
    addExperience,
    removeExperience,
    updateExperience,
    onSubmit,
  } = useCandidateProfile();

  const { register, formState: { errors } } = form;

  // Dialog State for adding/editing experience
  const [isExpOpen, setIsExpOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  
  // Experience Form fields
  const [expCompany, setExpCompany] = React.useState("");
  const [expRole, setExpRole] = React.useState("");
  const [expPeriod, setExpPeriod] = React.useState("");
  const [expDesc, setExpDesc] = React.useState("");

  const handleOpenAddExp = () => {
    setEditingIndex(null);
    setExpCompany("");
    setExpRole("");
    setExpPeriod("");
    setExpDesc("");
    setIsExpOpen(true);
  };

  const handleOpenEditExp = (index: number, item: ExperienceItem) => {
    setEditingIndex(index);
    setExpCompany(item.company);
    setExpRole(item.role);
    setExpPeriod(item.period);
    setExpDesc(item.description);
    setIsExpOpen(true);
  };

  const handleSaveExperience = () => {
    if (!expCompany || !expRole || !expPeriod || expDesc.length < 10) {
      return; // form validations
    }

    const expItem: ExperienceItem = {
      company: expCompany,
      role: expRole,
      period: expPeriod,
      description: expDesc,
    };

    if (editingIndex !== null) {
      updateExperience(editingIndex, expItem);
    } else {
      addExperience(expItem);
    }

    setIsExpOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-[#fafafc] dark:bg-zinc-950">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-muted-foreground mt-4">Cargando tu CV Digital...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#fafafc] dark:bg-zinc-950 py-8 px-4 md:px-8 max-w-[1000px] mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
          Mi CV Digital
        </h1>
        <p className="text-sm text-muted-foreground">
          Mantén tu perfil público actualizado para postularte a ofertas y hacer match mediante nuestro motor de IA.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8 pb-20">
        
        {/* Basic Info Section (Glassmorphic) */}
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Información General</h2>
              <p className="text-xs text-muted-foreground">Tus datos básicos de contacto e identidad profesional.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Nombre Completo</Label>
              <Input
                id="full_name"
                placeholder="Ej. Elena Rodríguez"
                className="h-11 rounded-xl bg-background/50"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Headline / Area Profesional */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="headline" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Área Profesional</Label>
              <Input
                id="headline"
                placeholder="Ej. Senior Product Designer o Repartidor Local"
                className="h-11 rounded-xl bg-background/50"
                {...register("headline")}
              />
              {errors.headline && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.headline.message}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Ubicación (Ciudad o Zona)</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="location"
                  placeholder="Ej. San Ángel, CDMX"
                  className="h-11 pl-10 rounded-xl bg-background/50"
                  {...register("location")}
                />
              </div>
              {errors.location && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* WhatsApp Contact Number */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsapp_number" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">WhatsApp / Celular de Contacto</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="whatsapp_number"
                  placeholder="Ej. +525512345678"
                  className="h-11 pl-10 rounded-xl bg-background/50"
                  {...register("whatsapp_number")}
                />
              </div>
              {errors.whatsapp_number && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.whatsapp_number.message}
                </p>
              )}
            </div>

            {/* Bio / Resumen de Experiencia */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="experience_summary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Sobre mí (Resumen Profesional)</Label>
              <Textarea
                id="experience_summary"
                placeholder="Escribe una breve descripción de tu perfil, tus motivaciones y tu experiencia laboral local..."
                className="min-h-24 rounded-xl bg-background/50 resize-none"
                {...register("experience_summary")}
              />
              {errors.experience_summary && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.experience_summary.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Skills Tag Section */}
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Stack de Habilidades</h2>
              <p className="text-xs text-muted-foreground">Habilidades y tecnologías claves analizadas por la recomendación IA.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Ej. React, Figma, Atención al cliente, Ventas..."
                  className="h-11 rounded-xl bg-background/50"
                />
              </div>
              <Button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="h-11 rounded-xl px-5 bg-primary text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {errors.skills && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.skills.message}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {skills.length > 0 ? (
                skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg transition-all"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-primary hover:text-primary-bright rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Aún no has agregado ninguna habilidad.</p>
              )}
            </div>
          </div>
        </section>

        {/* Portfolio Links Section (Glassmorphic) */}
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Portafolio y Enlaces</h2>
              <p className="text-xs text-muted-foreground">Comparte tus proyectos, perfiles profesionales o tu sitio web personal.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={portfolioInput}
                  onChange={(e) => setPortfolioInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPortfolioLink(portfolioInput);
                    }
                  }}
                  placeholder="Ej. https://github.com/usuario, https://linkedin.com/in/usuario..."
                  className="h-11 rounded-xl bg-background/50"
                />
              </div>
              <Button
                type="button"
                onClick={() => addPortfolioLink(portfolioInput)}
                className="h-11 rounded-xl px-5 bg-primary text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {errors.portfolio_links && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.portfolio_links.message}
              </p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {portfolioLinks.length > 0 ? (
                portfolioLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/30 hover:border-primary/20 transition-all"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary hover:underline truncate max-w-[85%]"
                    >
                      {link}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePortfolioLink(link)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">Aún no has agregado ningún enlace de portafolio.</p>
              )}
            </div>
          </div>
        </section>

        {/* Local Work Experience Section */}
        <section className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Experiencia Laboral Local</h2>
                <p className="text-xs text-muted-foreground">Tu historial laboral en negocios y empresas locales.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenAddExp}
              className="h-9 rounded-full text-xs font-bold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              Añadir
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {experience.length > 0 ? (
              <div className="relative border-l border-border/60 pl-5 ml-4 space-y-6">
                {experience.map((item, idx) => (
                  <div key={idx} className="relative group animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow-xs" />
                    
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{item.role}</h4>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {item.company} • {item.period}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/20 max-w-xl">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditExp(idx, item)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExperience(idx)}
                          className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/10 rounded-2xl border border-dashed border-border/80 flex flex-col items-center gap-3">
                <Briefcase className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No has añadido tu historial de experiencia profesional.</p>
                <Button
                  type="button"
                  onClick={handleOpenAddExp}
                  variant="link"
                  className="text-xs font-bold text-primary p-0"
                >
                  Agregar primer empleo local
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Global Save Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-full px-8 bg-primary hover:bg-primary/95 text-white text-sm font-bold shadow-md transition-all gap-2 border-none"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </Button>
        </div>

      </form>

      {/* Experience Dialog Manager */}
      <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
        <DialogContent className="max-w-[480px] rounded-3xl bg-card border border-border/40 shadow-xl px-6 py-6 flex flex-col gap-5">
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingIndex !== null ? "Editar Experiencia" : "Nueva Experiencia"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registra los detalles de tu puesto para que los reclutadores locales puedan revisarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Empresa / Negocio Local</Label>
              <Input
                id="exp-company"
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                placeholder="Ej. Tienda El Porvenir, Wayne Corp"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Puesto / Cargo</Label>
              <Input
                id="exp-role"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
                placeholder="Ej. Cajero, Ayudante General, Frontend Developer"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-period" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Período Laboral</Label>
              <Input
                id="exp-period"
                value={expPeriod}
                onChange={(e) => setExpPeriod(e.target.value)}
                placeholder="Ej. 2022 - Presente o Ene 2021 - Dic 2022"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Detalles del Trabajo (Mín. 10 carac.)</Label>
              <Textarea
                id="exp-desc"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value.substring(0, 300))}
                placeholder="Describe tus tareas diarias, responsabilidades y logros clave..."
                className="min-h-20 rounded-xl resize-none"
              />
              <span className="text-[10px] text-right text-muted-foreground/60">{expDesc.length}/300 caracteres</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpOpen(false)}
              className="h-10 rounded-full text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExperience}
              disabled={!expCompany || !expRole || !expPeriod || expDesc.length < 10}
              className="h-10 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/95 px-6 border-none"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Guardar Experiencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
