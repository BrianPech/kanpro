import * as React from "react";
import { toast } from "sonner";
import { companyService } from "../services/company-service";
import { createClient } from "@/lib/supabase/client";

export interface Experience {
  role: string;
  period: string;
  company: string;
  description: string;
}

export interface Education {
  degree: string;
  period: string;
  institution: string;
  description?: string;
}

export interface Applicant {
  id: string;
  name: string;
  headline: string;
  avatar: string;
  location: string;
  elapsedTime: string;
  status: "Pendiente" | "En revisión" | "Preseleccionado" | "Contratado" | "Descartado";
  rating: number;
  reviewsCount: number;
  bio: string;
  experiences: Experience[];
  education?: Education[];
  skills: string[];
  portfolio?: { image: string; title: string }[];
  phone: string;
  email?: string;
  vacancyTitle: string;
  vacancyId: string;
  candidateId: string;
}

export function useApplicationsInbox(userId: string) {
  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [vacancies, setVacancies] = React.useState<{ id: string; title: string }[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  // Load vacancies and applications
  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch vacancies
      const vacList = await companyService.getVacancies(userId);
      setVacancies(vacList || []);

      // Fetch applications
      const apps = await companyService.getApplications(userId);
      
      if (apps && apps.length > 0) {
        // Map database applications to Applicant format
        const mapped: Applicant[] = apps.map((app: any) => {
          const profile = app.candidate;
          
          // Parse experience
          let experiences: Experience[] = [];
          if (profile.experience && Array.isArray(profile.experience)) {
            experiences = profile.experience as Experience[];
          }
          
          // Parse education
          let education: Education[] = [];
          if (profile.education && Array.isArray(profile.education)) {
            education = profile.education as Education[];
          }

          // Parse skills
          let skills: string[] = [];
          if (profile.skills) {
            skills = Array.isArray(profile.skills) ? profile.skills : String(profile.skills).split(",");
          }

          // Determine elapsed time
          const date = new Date(app.created_at);
          const diffMs = Date.now() - date.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          
          let elapsedTime = "Hace poco";
          if (diffDays > 0) {
            elapsedTime = `Hace ${diffDays}d`;
          } else if (diffHours > 0) {
            elapsedTime = `Hace ${diffHours}h`;
          }

          return {
            id: app.id,
            name: profile.full_name || "Profesional K'anPro",
            headline: profile.headline || "Candidato",
            avatar: profile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
            location: profile.location || "Local",
            elapsedTime,
            status: app.status,
            rating: 5,
            reviewsCount: 5,
            bio: profile.bio || "Sin biografía disponible.",
            experiences,
            education,
            skills,
            phone: profile.phone || "",
            email: profile.email || "",
            vacancyTitle: app.vacancies?.title || "Vacante",
            vacancyId: app.vacancy_id,
            candidateId: profile.id,
            portfolio: [
              {
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop",
                title: "Código Limpio"
              },
              {
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
                title: "UI Portal"
              }
            ]
          };
        });
        
        setApplicants(mapped);
        if (mapped.length > 0) {
          setSelectedId(mapped[0].id);
        }
      } else {
        // Fallback to high-fidelity mock data if no db applications exist
        const mockApplicants: Applicant[] = [
          {
            id: "mock-1",
            name: "Elena Rodriguez",
            headline: "Senior Product Designer",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJLjSU-yJkXHyVUPb4Sa1YtkFC50TRMMBDjbw0KCOsfJWrfdXsyw2IFqFTnInR4SturkvP2v3S8VIRPOHcq2W2LIU90HGltdUt-IvvpeOO1JpzweTI6jMGRMXKbPiwSY51s9VHXc85Vh2QrinHxtKDSi3CcOR9iW91gNxSLxwn6OjCSba-o33LkmaCVrOoPcfQgFwtqoULsHsMJMgUnUk1jSZDk7lYWf3nftQHYdvvBOsMrmHy8BvLavkRqeOgbO7LVrRnifV4PzU",
            location: "Madrid, ES",
            elapsedTime: "Hace 2h",
            status: "Preseleccionado",
            rating: 4,
            reviewsCount: 12,
            bio: "Diseñadora de productos apasionada por crear experiencias fluidas y accesibles. Con más de 8 años de experiencia trabajando en startups fintech y SaaS de alto impacto, me especializo en sistemas de diseño y flujos de usuario complejos.",
            experiences: [
              {
                role: "Lead UI Designer",
                period: "2021 - Presente",
                company: "Global Fintech S.A.",
                description: "Liderazgo del equipo creativo y mantenimiento del Design System institucional."
              },
              {
                role: "UX Specialist",
                period: "2018 - 2021",
                company: "Innova Tech Studio",
                description: "Investigación de usuarios y prototipado rápido para clientes internacionales."
              }
            ],
            skills: ["Figma Mastery", "Design Systems", "React Foundation", "UX Research", "Motion Design", "Accessibility WCAG"],
            phone: "+34 600 123 456",
            email: "elena@diseno.com",
            vacancyTitle: "Sr. UI/UX Designer",
            vacancyId: "mock-vac-1",
            candidateId: "mock-candidate-1",
            portfolio: [
              {
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO2lzdff0_wzEDvpxNjVnlMrBBucYpAKmj6Vt8LvOhir0yxraAj8Sn9ONxw0jpfAOeVBYwAhy7yLypER3mdPCJh3YqRhBOzQ2VM_xdeLe5nnjZLswjdwGzCfIVvq4_s6TUwALUvv_b3_5cB-5XN9hoq20ML5yRI-U5qrVWeVzC4je8RAQvj7YZ6QtXp5dNwdsQIG1NHRo-UQeTjnNGqX2JVzIQEhLU5HDfIQrZwmE2p2aMRCYlMOvsTtAU-vy_x9_XnNIQ6pzSw9g",
                title: "Fintech Dashboard UI"
              },
              {
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDU6IJZrRF4VCHM5ZYFYRx9MLVErY3_kBtp_9gFzpF0lg0B0J68BKiGodaciSsTIFKJCV7oXm57_7c-nuEnxJXx6Yug9bYeBkDpVFk9yLGvgtp3_QdIEZkbVC9cXcxFLyblhe1b0uuuoxxe_2jI0y7etKd5xjyme6XHXytzLheifH9CCZT_2TegG6dudIUXCVCEhtIt1imACxXyDxfla_9GYSbfFUxgfEUfPF_qIh4R8fTyqRX4L6Pnt7ANLptJAh7Ir0zM3Mbm7Kc",
                title: "Mobile App Layout"
              }
            ]
          },
          {
            id: "mock-2",
            name: "Marco Valdivia",
            headline: "Fullstack Engineer",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuANyNGJmMghWHQjDJX8i2hr6E-Y0-dBUMKpJnTRPg7AYrfMg1mFfIE14CcaQerHWmiJPWYesLzXz9sG8fxPepie0xyNosfR52mB71AP-LhXo4eB6nmrJuM7lYWGBcddxmyeMg4ykcBLUv9FYzdG9XxtLJY-jZN2ORf56Jb3JkmO8THRtQotl32Yp2FGLGb5i0Jeotl7XXddWGGS68Yqhq0UvlhfJaTshgRdqM8e8LFaCXy-fT-MlPoJrBJNV_946WPJxa2YGey5KVs",
            location: "Barcelona, ES",
            elapsedTime: "Hace 5h",
            status: "En revisión",
            rating: 5,
            reviewsCount: 18,
            bio: "Ingeniero fullstack apasionado por la escalabilidad y las arquitecturas de microservicios. Con experiencia en plataformas de comercio electrónico robustas y en la migración de legados hacia nubes elásticas.",
            experiences: [
              {
                role: "Senior Backend Developer",
                period: "2020 - Presente",
                company: "SaaS Rocket Corp",
                description: "Rediseño completo del núcleo de procesamiento con Node.js, Go y Postgres."
              }
            ],
            skills: ["Node.js / Express", "React / Next.js", "Docker & Kubernetes", "AWS Architecture", "PostgreSQL Expert"],
            phone: "+34 600 987 654",
            email: "marco@dev.com",
            vacancyTitle: "Full Stack Engineer",
            vacancyId: "mock-vac-2",
            candidateId: "mock-candidate-2",
            portfolio: [
              {
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop",
                title: "Microservices Platform"
              }
            ]
          }
        ];
        setApplicants(mockApplicants);
        setSelectedId("mock-1");
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Error al cargar postulaciones");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected applicant details
  const selectedApplicant = React.useMemo(() => {
    return applicants.find((app) => app.id === selectedId) || null;
  }, [applicants, selectedId]);

  // Update status action
  const handleUpdateStatus = async (id: string, newStatus: Applicant["status"]) => {
    try {
      if (!id.startsWith("mock-")) {
        await companyService.updateApplicationStatus(id, newStatus);
      }
      
      setApplicants((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );

      toast.success(`Postulación actualizada: ${newStatus}`, {
        description: `Se ha marcado la postulación como "${newStatus}".`
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Error al actualizar el estado de la postulación");
    }
  };

  // WhatsApp helper
  const getWhatsAppLink = (applicant: Applicant) => {
    if (!applicant.phone) return "";
    const cleanPhone = applicant.phone.replace(/[^0-9]/g, "");
    const message = `Hola ${applicant.name}, te saludamos de parte de K'anPro. Hemos visto tu postulación para la vacante de "${applicant.vacancyTitle}" y nos encantaría agendar una entrevista contigo. ¿Tienes disponibilidad esta semana?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Create contact notification via secure RPC
  const handleContactApplicant = async (applicant: Applicant) => {
    try {
      if (applicant.id.startsWith("mock-")) return;

      const supabase = createClient();
      // Fetch company name
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", userId)
        .single();

      const companyName = companyProfile?.company_name || "Empresa";

      // Trigger candidate contact notification via RPC
      const { error } = await (supabase as any).rpc("notify_candidate_contact", {
        p_candidate_id: applicant.candidateId,
        p_vacancy_title: applicant.vacancyTitle,
        p_company_name: companyName,
      });

      if (error) {
        console.error("Error creating contact notification:", error);
      }
    } catch (err) {
      console.error("Error executing handleContactApplicant:", err);
    }
  };

  return {
    applicants,
    vacancies,
    selectedVacancyId,
    setSelectedVacancyId,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    selectedApplicant,
    isLoading,
    handleUpdateStatus,
    getWhatsAppLink,
    handleContactApplicant,
    reloadData: loadData,
  };
}
