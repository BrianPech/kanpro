"use client"

import * as React from "react"
import { 
  Search, 
  Filter, 
  Mail, 
  MoreVertical, 
  Star, 
  MapPin, 
  Briefcase, 
  Award,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Experience {
  role: string
  period: string
  company: string
  description: string
}

interface PortfolioItem {
  image: string
  title: string
}

interface Applicant {
  id: number
  name: string
  headline: string
  avatar: string
  location: string
  elapsedTime: string
  status: "Preseleccionado" | "En revisión" | "Pendiente"
  rating: number
  reviewsCount: number
  bio: string
  experiences: Experience[]
  skills: string[]
  portfolio: PortfolioItem[]
  detailsAvatar: string
}

export function ApplicationsInbox() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState(1)

  // Rich seed applicants dataset following the official visual specs
  const [applicants, setApplicants] = React.useState<Applicant[]>([
    {
      id: 1,
      name: "Elena Rodriguez",
      headline: "Senior Product Designer",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJLjSU-yJkXHyVUPb4Sa1YtkFC50TRMMBDjbw0KCOsfJWrfdXsyw2IFqFTnInR4SturkvP2v3S8VIRPOHcq2W2LIU90HGltdUt-IvvpeOO1JpzweTI6jMGRMXKbPiwSY51s9VHXc85Vh2QrinHxtKDSi3CcOR9iW91gNxSLxwn6OjCSba-o33LkmaCVrOoPcfQgFwtqoULsHsMJMgUnUk1jSZDk7lYWf3nftQHYdvvBOsMrmHy8BvLavkRqeOgbO7LVrRnifV4PzU",
      detailsAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXxpOP5jCtclEgM_tgg7TYBCMtJwSwRKtTuBCkGnr8erk1wsvn5z-sLNZorBwEkRGFqj7k8YofHtJxqf6wt6kp6fudrDG4_VM5eoXDS59lDj8rcx5elVCToaACkEGPY563dWJt75zJLoQydIUGi9G12EyYK7975f1oA-I0pzDdWDPlZCNL7na5zqZdIFc3Zhcqe6J_ZRs2nWZv_TR4I86QeDp1msZKyoCoao0m7WySky-RD7FfYQ4hi-Jh1vb7L6aPEJVdUKIXmWw",
      location: "Madrid, ES",
      elapsedTime: "Hace 2h",
      status: "Preseleccionado",
      rating: 4,
      reviewsCount: 12,
      bio: "Diseñadora de productos apasionada por crear experiencias fluidas y accesibles. Con más de 8 años de experiencia trabajando en startups fintech y SaaS de alto impacto, me especializo en sistemas de diseño y flujos de usuario complejos que reducen la fricción cognitiva.",
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
      portfolio: [
        {
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAO2lzdff0_wzEDvpxNjVnlMrBBucYpAKmj6Vt8LvOhir0yxraAj8Sn9ONxw0jpfAOeVBYwAhy7yLypER3mdPCJh3YqRhBOzQ2VM_xdeLe5nnjZLswjdwGzCfIVvq4_s6TUwALUvv_b3_5cB-5XN9hoq20ML5yRI-U5qrVWeVzC4je8RAQvj7YZ6QtXp5dNwdsQIG1NHRo-UQeTjnNGqX2JVzIQEhLU5HDfIQrZwmE2p2aMRCYlMOvsTtAU-vy_x9_XnNIQ6pzSw9g",
          title: "Fintech Dashboard UI"
        },
        {
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDU6IJZrRF4VCHM5ZYFYRx9MLVErY3_kBtp_9gFzpF0lg0B0J68BKiGodaciSsTIFKJCV7oXm57_7c-nuEnxJXx6Yug9bYeBkDpVFk9yLGvgtp3_QdIEZkbVC9cXcxFLyblhe1b0uuuoxxe_2jI0y7etKd5xjyme6XHXytzLheifH9CCZT_2TegG6dudIUXCVCEhtIt1imACxXyDxfla_9GYSbfFUxgfEUfPF_qIh4R8fTyqRX4L6Pnt7ANLptJAh7Ir0zM3Mbm7Kc",
          title: "Mobile App Layout"
        },
        {
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuApQUfar5kJ2zVY6KO0COdnowngeTpcx6fUxgyUi6ktDkU8lklfkqbR-M9_CJzhVW0SyM-mSs-znizHHEzFpEwGzCs9Al4jnji38Egsx5XRoHJ3a0jTQ_YGpeggk8Yb0Y-GcnHurIg3Xhhx8w8WvP-e-NL9S3kU5VBW8AfxDD9KUyXsNmLO_QhNW_hhofljO11_2gYOVRAGLYCoFqRBKocv3OIlF3FazgDF_oeWgVpx72hrZumArvBATfQuRaUXgQ8OK2duxCMbMHA",
          title: "Wireframing Desk Setup"
        }
      ]
    },
    {
      id: 2,
      name: "Marco Valdivia",
      headline: "Fullstack Engineer",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuANyNGJmMghWHQjDJX8i2hr6E-Y0-dBUMKpJnTRPg7AYrfMg1mFfIE14CcaQerHWmiJPWYesLzXz9sG8fxPepie0xyNosfR52mB71AP-LhXo4eB6nmrJuM7lYWGBcddxmyeMg4ykcBLUv9FYzdG9XxtLJY-jZN2ORf56Jb3JkmO8THRtQotl32Yp2FGLGb5i0Jeotl7XXddWGGS68Yqhq0UvlhfJaTshgRdqM8e8LFaCXy-fT-MlPoJrBJNV_946WPJxa2YGey5KVs",
      detailsAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuANyNGJmMghWHQjDJX8i2hr6E-Y0-dBUMKpJnTRPg7AYrfMg1mFfIE14CcaQerHWmiJPWYesLzXz9sG8fxPepie0xyNosfR52mB71AP-LhXo4eB6nmrJuM7lYWGBcddxmyeMg4ykcBLUv9FYzdG9XxtLJY-jZN2ORf56Jb3JkmO8THRtQotl32Yp2FGLGb5i0Jeotl7XXddWGGS68Yqhq0UvlhfJaTshgRdqM8e8LFaCXy-fT-MlPoJrBJNV_946WPJxa2YGey5KVs",
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
        },
        {
          role: "Fullstack Engineer",
          period: "2017 - 2020",
          company: "Nexus E-Commerce",
          description: "Desarrollo del front y optimización de flujos de pago con React y Redux."
        }
      ],
      skills: ["Node.js / Express", "React / Next.js", "Docker & Kubernetes", "AWS Architecture", "PostgreSQL Expert", "CI/CD Pipelines"],
      portfolio: [
        {
          image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop",
          title: "Microservices Platform"
        },
        {
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
          title: "Analytics Portal UI"
        },
        {
          image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop",
          title: "Security Shield Architecture"
        }
      ]
    },
    {
      id: 3,
      name: "Sofía Méndez",
      headline: "UX Researcher",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwgVbMN3FZOctevRBYViXQ8SwLKOMNRb8thOEuAhq82spwYxaPrNnGry3kF3LfTRJcybW5Kvnb-2H_h7i_nyrW5dOXp3-EwDVTUywPoXF7wN4KHuAl2Qe25MBGwYuw198Sx4dhMOyJVmWBIH5o-dNfApoCnweXfxv0M9nDePSqjWlCgoKHtDFz06alVkBBabMuqys8g-xqsEtemTFTNXIyzFY4GFxMtgyM2sbhk_JhRi1SV3dIZzqhjf5UZkj8B6jD2QHIYjk4yJU",
      detailsAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwgVbMN3FZOctevRBYViXQ8SwLKOMNRb8thOEuAhq82spwYxaPrNnGry3kF3LfTRJcybW5Kvnb-2H_h7i_nyrW5dOXp3-EwDVTUywPoXF7wN4KHuAl2Qe25MBGwYuw198Sx4dhMOyJVmWBIH5o-dNfApoCnweXfxv0M9nDePSqjWlCgoKHtDFz06alVkBBabMuqys8g-xqsEtemTFTNXIyzFY4GFxMtgyM2sbhk_JhRi1SV3dIZzqhjf5UZkj8B6jD2QHIYjk4yJU",
      location: "Valencia, ES",
      elapsedTime: "Ayer",
      status: "Pendiente",
      rating: 4,
      reviewsCount: 8,
      bio: "Especialista en investigación UX. Mi labor se enfoca en entender las motivaciones del usuario mediante pruebas de usabilidad, mapas de empatía y surveys robustos para guiar el desarrollo de productos digitales.",
      experiences: [
        {
          role: "UX Research Specialist",
          period: "2019 - Presente",
          company: "Cognitive Labs Co",
          description: "Planificación de pruebas A/B, reclutamiento y reportes estratégicos para Big Data."
        },
        {
          role: "Interaction Designer",
          period: "2017 - 2019",
          company: "Creative Studio ES",
          description: "Definición de flujos y testeos cualitativos rápidos con usuarios finales."
        }
      ],
      skills: ["Qualitative Research", "User Testing", "Persona Archetypes", "Hotjar & Analytics", "Information Architecture", "Heuristic Analysis"],
      portfolio: [
        {
          image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=400&fit=crop",
          title: "User Testing Video Session"
        },
        {
          image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&h=400&fit=crop",
          title: "Empathy Mapping Diagram"
        },
        {
          image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop",
          title: "User Journey Matrix"
        }
      ]
    },
    {
      id: 4,
      name: "Javier Soto",
      headline: "Data Scientist",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDagCfbVfdYBSVDFhrFGeX3LRDqu7aavsbaSCpKlscgDyCBkngQxQ0W5rGoZ_DgJc3clMHIxG8o5H4nUfxBHf5EJmcjdNO26-_wBZDWqK3ocqLyhHO7qyOYhF8IF3WdAYS3GxWeL3O5T_2S2TsxbJnG5UAdjmNvttFA-7cp7guoe3Qncim-3JQvSF74JHB_tnf9CghZfBV-wF0ftgYCxUT51-Pcgx1v8MnDrSBh82v6vr48SzBL4uLPlmXaq-xwnqQrlbBrdQ06gSw",
      detailsAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDagCfbVfdYBSVDFhrFGeX3LRDqu7aavsbaSCpKlscgDyCBkngQxQ0W5rGoZ_DgJc3clMHIxG8o5H4nUfxBHf5EJmcjdNO26-_wBZDWqK3ocqLyhHO7qyOYhF8IF3WdAYS3GxWeL3O5T_2S2TsxbJnG5UAdjmNvttFA-7cp7guoe3Qncim-3JQvSF74JHB_tnf9CghZfBV-wF0ftgYCxUT51-Pcgx1v8MnDrSBh82v6vr48SzBL4uLPlmXaq-xwnqQrlbBrdQ06gSw",
      location: "Sevilla, ES",
      elapsedTime: "Ayer",
      status: "Pendiente",
      rating: 5,
      reviewsCount: 15,
      bio: "Científico de datos especializado en aprendizaje automático y procesamiento de lenguaje natural. Apasionado por extraer patrones valiosos desde grandes bases de datos para guiar la toma de decisiones empresariales.",
      experiences: [
        {
          role: "Senior Data Scientist",
          period: "2021 - Presente",
          company: "Alpha Intelligence Ltd",
          description: "Despliegue de modelos LLM ajustados en producción y análisis predictivo financiero."
        },
        {
          role: "Data Analyst Lead",
          period: "2018 - 2021",
          company: "Sistemas Clínicos S.A.",
          description: "Clasificación inteligente de historiales de pacientes y reportes automatizados."
        }
      ],
      skills: ["Python Mastery", "Pandas & NumPy", "Machine Learning", "NLP / Transformers", "TensorFlow & PyTorch", "BigData Spark"],
      portfolio: [
        {
          image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop",
          title: "Neural Network Weights Visualization"
        },
        {
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop",
          title: "Predictive Sales Models Dashboard"
        },
        {
          image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=400&fit=crop",
          title: "Clustering Algorithms Graph"
        }
      ]
    }
  ])

  // Get active candidate detail data
  const selectedApplicant = React.useMemo(() => {
    return applicants.find((app) => app.id === selectedId) || applicants[0]
  }, [applicants, selectedId])

  // Filter roster based on search text (matching name or headline)
  const filteredApplicants = React.useMemo(() => {
    if (!searchQuery) return applicants
    const query = searchQuery.toLowerCase()
    return applicants.filter(
      (app) =>
        app.name.toLowerCase().includes(query) ||
        app.headline.toLowerCase().includes(query)
    )
  }, [applicants, searchQuery])

  // Process Advancement Hook Action
  const handleAdvanceProcess = (id: number) => {
    const applicant = applicants.find((a) => a.id === id)
    if (!applicant) return

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: "Preseleccionado" } : app
      )
    )
    
    toast.success("Proceso Avanzado", {
      description: `Elena y el equipo de K'anPro han preseleccionado a ${applicant.name}.`,
    })
  }

  // Discard Hook Action
  const handleDiscard = (id: number) => {
    const applicant = applicants.find((a) => a.id === id)
    if (!applicant) return

    toast.warning("Candidato Descartado", {
      description: `Se ha archivado la postulación de ${applicant.name}.`,
    })
  }

  // Interactive Message trigger
  const handleOpenMessage = (applicant: Applicant) => {
    toast.info("Iniciando chat...", {
      description: `Conectando con la bandeja de mensajes de ${applicant.name}.`,
    })
  }

  return (
    <div className="flex-grow flex h-[calc(100vh-65px)] overflow-hidden bg-background/30 selection:bg-primary/20 animate-in fade-in duration-300">
      
      {/* ================= LEFT COLUMN: APPLICANTS ROSTER (40%) ================= */}
      <div className="w-full md:w-[40%] flex flex-col border-r border-border/40 bg-card/10 relative h-full">
        
        {/* Roster Header */}
        <div className="p-6 border-b border-border/40 flex justify-between items-center bg-background/50 backdrop-blur-sm shrink-0">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight md:text-2xl">
            Postulantes
          </h2>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs font-sans tracking-wide">
            {filteredApplicants.length} Total
          </span>
        </div>

        {/* Search & Filter Mini Pane inside roster */}
        <div className="px-6 py-4 border-b border-border/30 shrink-0 bg-background/20 flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-4 h-9 bg-card border-border/60 rounded-full text-xs font-semibold focus-visible:ring-primary/20"
              placeholder="Buscar por nombre o puesto..."
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => toast.info("Filtros roster rápidos", { description: "Próximamente podrás ordenar por nivel de score de afinidad." })}
            className="size-9 rounded-full border-border/60 text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
          >
            <Filter className="size-3.5" />
          </Button>
        </div>

        {/* Candidate Scrollable Cards */}
        <div className="overflow-y-auto hide-scrollbar flex-grow divide-y divide-border/20">
          {filteredApplicants.map((applicant) => {
            const isSelected = applicant.id === selectedId
            return (
              <div 
                key={applicant.id}
                onClick={() => setSelectedId(applicant.id)}
                className={`p-6 cursor-pointer transition-all duration-300 flex gap-4 ${
                  isSelected 
                    ? "bg-card border-l-4 border-primary shadow-sm" 
                    : "hover:bg-muted/30 border-b border-border/20"
                }`}
              >
                <img 
                  alt={applicant.name} 
                  className="h-12 w-12 rounded-xl object-cover border border-border/40 shadow-sm"
                  src={applicant.avatar} 
                />
                
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                      {applicant.name}
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground font-sans shrink-0 whitespace-nowrap">
                      {applicant.elapsedTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-3 truncate">
                    {applicant.headline}
                  </p>
                  
                  {/* Status Pills */}
                  <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-default ${
                    applicant.status === "Preseleccionado" 
                      ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" 
                      : applicant.status === "En revisión"
                      ? "bg-muted text-muted-foreground border border-border/40"
                      : "bg-error-container text-on-error-container"
                  }`}>
                    {applicant.status}
                  </span>
                </div>
              </div>
            )
          })}

          {filteredApplicants.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Award className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground font-medium">No se encontraron postulantes con esos términos.</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: APPLICANT DETAILS SHOWCASE (60%) ================= */}
      <div className="hidden md:flex md:w-[60%] bg-muted/10 dark:bg-background/20 flex-col relative h-full">
        
        {/* Sticky Detail Header */}
        <div className="p-8 sticky top-0 bg-background/90 dark:bg-card/90 backdrop-blur-xl z-10 border-b border-border/40 shrink-0">
          <div className="flex justify-between items-start gap-6">
            
            <div className="flex gap-6 items-center min-w-0">
              <div className="h-20 w-20 rounded-3xl overflow-hidden shadow-md shadow-primary/5 border-2 border-primary/10 flex-shrink-0">
                <img 
                  className="h-full w-full object-cover" 
                  alt={selectedApplicant.name}
                  src={selectedApplicant.detailsAvatar} 
                />
              </div>
              
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight truncate">
                  {selectedApplicant.name}
                </h2>
                <p className="text-primary font-bold text-xs md:text-sm mt-1 truncate">
                  {selectedApplicant.headline} • {selectedApplicant.location}
                </p>
                
                {/* Rating Review Stars */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= selectedApplicant.rating
                      return (
                        <Star 
                          key={star} 
                          className={`size-3.5 ${isFilled ? "text-amber-500 fill-amber-500" : "text-muted/60"}`} 
                        />
                      )
                    })}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground font-sans">
                    ({selectedApplicant.reviewsCount} Reseñas)
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleOpenMessage(selectedApplicant)}
                className="size-11 rounded-2xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm active:scale-95 transition-all"
              >
                <Mail className="size-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => toast.info("Menú de opciones candidato")}
                className="size-11 rounded-2xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground shadow-sm active:scale-95 transition-all"
              >
                <MoreVertical className="size-4" />
              </Button>
            </div>

          </div>
        </div>

        {/* Scrollable Detail Body Content */}
        <div className="overflow-y-auto hide-scrollbar flex-grow p-8 space-y-8 pb-32">
          
          {/* Headline & Bio Section */}
          <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="size-3.5 text-primary" /> Headline & Bio
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-foreground font-medium font-sans">
              {selectedApplicant.bio}
            </p>
          </div>

          {/* Experience Grid Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
              <Briefcase className="size-3.5 text-primary" /> Experiencia Reciente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedApplicant.experiences.map((exp, index) => (
                <div key={index} className="bg-card p-6 rounded-[24px] border border-border/60 shadow-sm flex flex-col justify-between hover:border-border transition-colors">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="font-extrabold text-sm text-foreground">{exp.role}</h4>
                      <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full shrink-0 font-sans tracking-wide">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold mb-3">{exp.company}</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed font-sans line-clamp-3">
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Skills Badges Section */}
          <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-sm relative overflow-hidden group">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" /> Habilidades Técnicas
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedApplicant.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-secondary/15 text-secondary dark:text-primary-fixed-dim rounded-full text-xs font-bold border border-secondary/10 hover:bg-secondary/20 transition-all cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio Previews Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-primary" /> Portafolio Destacado
              </h3>
              <Button 
                variant="link" 
                onClick={() => toast.info("Accediendo a portafolio externo", { description: `Cargando enlaces externos de ${selectedApplicant.name}.` })}
                className="text-xs font-bold text-primary p-0 h-auto flex items-center gap-1 hover:text-primary/95 transition-colors"
              >
                Ver todo <ExternalLink className="size-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {selectedApplicant.portfolio.map((item, index) => {
                const isLast = index === 2
                return (
                  <div 
                    key={index}
                    onClick={() => toast.info(`Abriendo portfolio: ${item.title}`)}
                    className="aspect-square bg-muted/40 rounded-2xl overflow-hidden group cursor-pointer border border-border/50 relative shadow-sm"
                  >
                    <img 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={item.title}
                      src={item.image} 
                    />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white font-extrabold text-xs md:text-sm">+8 más</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* Fixed Bottom Action Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-background/80 dark:bg-card/85 backdrop-blur-md border-t border-border/40 flex justify-end gap-4 z-10 shrink-0">
          <Button 
            variant="ghost"
            onClick={() => handleDiscard(selectedApplicant.id)}
            className="px-8 py-5 h-auto rounded-full font-bold text-muted-foreground hover:bg-muted text-xs md:text-sm active:scale-95 transition-all shadow-none"
          >
            Descartar
          </Button>
          <Button 
            onClick={() => handleAdvanceProcess(selectedApplicant.id)}
            className="px-8 py-5 h-auto rounded-full font-bold bg-primary text-on-primary hover:bg-primary/95 text-xs md:text-sm active:scale-95 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/25"
          >
            Avanzar Proceso
          </Button>
        </div>

      </div>

    </div>
  )
}
