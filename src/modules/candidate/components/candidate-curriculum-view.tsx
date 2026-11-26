"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  File01Icon,
  Loading03Icon,
  PencilEdit02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  candidateProfileService,
  type CandidateProfileData,
} from "../services/candidate-profile";

type CurriculumSection =
  | "presentation"
  | "experience"
  | "education"
  | "skills"
  | "languages";

interface ExperienceEntry {
  role: string;
  company: string;
  period: string;
  description: string;
}

interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
}

interface LanguageEntry {
  language: string;
  level: string;
}

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export function CandidateCurriculumView() {
  const router = useRouter();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<CandidateProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSection, setActiveSection] =
    React.useState<CurriculumSection | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Draft fields for the currently open section sheet
  const [draftHeadline, setDraftHeadline] = React.useState("");
  const [draftBio, setDraftBio] = React.useState("");
  const [draftExpRole, setDraftExpRole] = React.useState("");
  const [draftExpCompany, setDraftExpCompany] = React.useState("");
  const [draftExpPeriod, setDraftExpPeriod] = React.useState("");
  const [draftEduDegree, setDraftEduDegree] = React.useState("");
  const [draftEduInstitution, setDraftEduInstitution] = React.useState("");
  const [draftSkillsText, setDraftSkillsText] = React.useState("");
  const [draftLanguage, setDraftLanguage] = React.useState("");
  const [draftLangLevel, setDraftLangLevel] = React.useState("");

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active || !user) return;
        setUserId(user.id);
        const data = await candidateProfileService.getProfile(user.id);
        if (active) setProfile(data);
      } catch (err) {
        console.error("Error loading curriculum:", err);
        toast.error("No pudimos cargar tu currículum");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const experiences = asArray<ExperienceEntry>(profile?.experience);
  const educations = asArray<EducationEntry>(profile?.education);
  const skills = profile?.skills ?? [];
  const languages = asArray<LanguageEntry>(profile?.languages);

  const openSection = (section: CurriculumSection) => {
    setDraftHeadline(profile?.headline || "");
    setDraftBio(profile?.experience_summary || "");
    setDraftExpRole(experiences[0]?.role || "");
    setDraftExpCompany(experiences[0]?.company || "");
    setDraftExpPeriod(experiences[0]?.period || "");
    setDraftEduDegree(educations[0]?.degree || "");
    setDraftEduInstitution(educations[0]?.institution || "");
    setDraftSkillsText(skills.join(", "));
    setDraftLanguage(languages[0]?.language || "Español");
    setDraftLangLevel(languages[0]?.level || "Nativo");
    setActiveSection(section);
  };

  const handleSaveSection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !activeSection || isSaving) return;

    setIsSaving(true);
    try {
      if (activeSection === "presentation") {
        await candidateProfileService.updateProfile(userId, {
          headline: draftHeadline.trim(),
          experience_summary: draftBio.trim(),
        });
      } else if (activeSection === "experience") {
        const nextList: ExperienceEntry[] = draftExpRole.trim()
          ? [
              {
                role: draftExpRole.trim(),
                company: draftExpCompany.trim() || "Empresa",
                period: draftExpPeriod.trim() || "Actual",
                description: experiences[0]?.description || "",
              },
              ...experiences.slice(1).map((item) => ({
                ...item,
                description: item.description || "",
              })),
            ]
          : experiences.map((item) => ({
              ...item,
              description: item.description || "",
            }));
        await candidateProfileService.updateProfile(userId, {
          experience: nextList,
        });
      } else if (activeSection === "education") {
        const nextList = draftEduDegree.trim()
          ? [
              {
                degree: draftEduDegree.trim(),
                institution: draftEduInstitution.trim() || "Institución",
                period: educations[0]?.period || "Concluido",
              },
              ...educations.slice(1),
            ]
          : educations;
        await candidateProfileService.updateProfile(userId, {
          education: nextList,
        });
      } else if (activeSection === "skills") {
        const parsedSkills = draftSkillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await candidateProfileService.updateProfile(userId, {
          skills: parsedSkills,
        });
      } else if (activeSection === "languages") {
        const nextLangs = draftLanguage.trim()
          ? [
              {
                language: draftLanguage.trim(),
                level: draftLangLevel.trim() || "Básico",
              },
              ...languages.slice(1),
            ]
          : languages;
        await candidateProfileService.updateProfile(userId, {
          languages: nextLangs as unknown as CandidateProfileData["languages"],
        });
      }

      const refreshed = await candidateProfileService.getProfile(userId);
      setProfile(refreshed);
      setActiveSection(null);
      toast.success("Currículum actualizado");
    } catch (err) {
      console.error("Error saving curriculum section:", err);
      toast.error("No pudimos guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const rows: ReadonlyArray<{
    id: CurriculumSection;
    title: string;
    subtitle: string;
    icon: typeof UserCircleIcon;
  }> = [
    {
      id: "presentation",
      title: "Presentación",
      subtitle: profile?.headline?.trim() || "Agrega tu puesto o resumen",
      icon: UserCircleIcon,
    },
    {
      id: "experience",
      title: "Experiencia laboral",
      subtitle:
        experiences.length === 0
          ? "Agrega tu experiencia"
          : `${experiences.length} ${
              experiences.length === 1
                ? "experiencia registrada"
                : "experiencias registradas"
            }`,
      icon: Briefcase01Icon,
    },
    {
      id: "education",
      title: "Educación",
      subtitle: educations[0]?.degree || "Agrega tu formación académica",
      icon: File01Icon,
    },
    {
      id: "skills",
      title: "Habilidades",
      subtitle:
        skills.length === 0
          ? "Agrega tus habilidades"
          : skills.length > 2
            ? `${skills.slice(0, 2).join(", ")} y más`
            : skills.join(", "),
      icon: PencilEdit02Icon,
    },
    {
      id: "languages",
      title: "Idiomas",
      subtitle: languages[0]
        ? `${languages[0].language} · ${languages[0].level}`
        : "Agrega tus idiomas",
      icon: File01Icon,
    },
  ];

  const sectionTitles: Record<CurriculumSection, string> = {
    presentation: "Presentación",
    experience: "Experiencia laboral",
    education: "Educación",
    skills: "Habilidades",
    languages: "Idiomas",
  };

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 pb-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/candidate/profile")}
            aria-label="Volver a Mi perfil"
            className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Mi currículum
          </h1>
        </div>
        <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
          Tu trayectoria profesional, en un solo lugar.
        </p>
      </header>

      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-[8px]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => openSection(row.id)}
              className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={row.icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-[16px] font-semibold leading-[22px] text-foreground">
                  {row.title}
                </p>
                <p className="truncate text-[14px] font-normal leading-[19px] text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(activeSection)}
        onOpenChange={(open) => !open && setActiveSection(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto w-full max-w-[480px] max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-[4px] w-[48px] rounded-[2px] bg-input"
          />

          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-[24px] font-bold leading-[32px] text-foreground">
              {activeSection ? sectionTitles[activeSection] : ""}
            </SheetTitle>
            <SheetClose
              render={
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="-mr-2 inline-flex size-[48px] cursor-pointer items-center justify-center rounded-[8px] text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.75} />
            </SheetClose>
          </div>

          {activeSection && (
            <form
              onSubmit={handleSaveSection}
              className="mt-6 flex flex-col gap-4"
            >
              {activeSection === "presentation" && (
                <>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Puesto o titular
                    <input
                      type="text"
                      value={draftHeadline}
                      onChange={(e) => setDraftHeadline(e.target.value)}
                      placeholder="Ej. Auxiliar administrativa"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Resumen profesional
                    <textarea
                      rows={4}
                      value={draftBio}
                      onChange={(e) => setDraftBio(e.target.value)}
                      placeholder="Describe brevemente tu experiencia y fortalezas."
                      className="rounded-[8px] border border-input bg-background p-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                </>
              )}

              {activeSection === "experience" && (
                <>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Puesto más reciente
                    <input
                      type="text"
                      value={draftExpRole}
                      onChange={(e) => setDraftExpRole(e.target.value)}
                      placeholder="Ej. Auxiliar contable"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Empresa
                    <input
                      type="text"
                      value={draftExpCompany}
                      onChange={(e) => setDraftExpCompany(e.target.value)}
                      placeholder="Ej. Grupo Península"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Período
                    <input
                      type="text"
                      value={draftExpPeriod}
                      onChange={(e) => setDraftExpPeriod(e.target.value)}
                      placeholder="Ej. 2023 – Actual"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                </>
              )}

              {activeSection === "education" && (
                <>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Grado o carrera
                    <input
                      type="text"
                      value={draftEduDegree}
                      onChange={(e) => setDraftEduDegree(e.target.value)}
                      placeholder="Ej. Técnico en administración"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Institución
                    <input
                      type="text"
                      value={draftEduInstitution}
                      onChange={(e) => setDraftEduInstitution(e.target.value)}
                      placeholder="Ej. CONALEP Cancún"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                </>
              )}

              {activeSection === "skills" && (
                <label className="flex flex-col gap-2 text-[14px] text-foreground">
                  Habilidades (separadas por coma)
                  <input
                    type="text"
                    value={draftSkillsText}
                    onChange={(e) => setDraftSkillsText(e.target.value)}
                    placeholder="Atención al cliente, Excel, Organización"
                    className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                  />
                </label>
              )}

              {activeSection === "languages" && (
                <>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Idioma principal
                    <input
                      type="text"
                      value={draftLanguage}
                      onChange={(e) => setDraftLanguage(e.target.value)}
                      placeholder="Español"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-[14px] text-foreground">
                    Nivel
                    <input
                      type="text"
                      value={draftLangLevel}
                      onChange={(e) => setDraftLangLevel(e.target.value)}
                      placeholder="Nativo / Intermedio / Avanzado"
                      className="h-[48px] rounded-[8px] border border-input bg-background px-4 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSaving && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={20}
                    strokeWidth={2}
                    className="animate-spin"
                  />
                )}
                <span>{isSaving ? "Guardando…" : "Guardar"}</span>
              </button>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
