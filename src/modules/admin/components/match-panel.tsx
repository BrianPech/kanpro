"use client";

import * as React from "react";
import { 
  Search, 
  Star, 
  Bolt, 
  Cloud, 
  Paintbrush, 
  Database, 
  Sparkles, 
  UserSearch, 
  Briefcase, 
  CheckCircle2, 
  Loader2,
  Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Candidate {
  id: string;
  name: string;
  avatar: string;
  position: string;
  score: string;
  status: string;
  isAvailable: boolean;
  skills: string[];
}

interface Job {
  id: string;
  company: string;
  position: string;
  salary: string;
  location: string;
  description: string;
  skills: string[];
  icon: React.ReactNode;
}

const mockCandidates: Candidate[] = [
  {
    id: "c1",
    name: "Elena Rodriguez",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDj5GNyUcoZwQK0sRWL0HFww7vb0FCNL2Auytxu2lwNDIPzzfkMZK0FC4xoy2mw179zy4SgHcf97I249xrGBbUEMdIAIPRkI2io6bb-0NfE8bY6623xDV9T94621Ud_YLUwZpfrMgZRkzyElKpNB65V4CknQjMqP04sf-qQ2eNv0NECN0WPhquPwgmupctSO-JVLgKCyQrWtHBZgrzMoC784f3aiVmpUx15n587zXsF7nyLJkcKrVuJ5rZM4oNUiaPHp5PUN2up0qI",
    position: "Senior Cloud Architect",
    score: "4.9 Rare Talent Score",
    status: "Available Now",
    isAvailable: true,
    skills: ["AWS EKS", "Terraform", "Python", "Kubernetes", "Docker", "CI/CD"]
  },
  {
    id: "c2",
    name: "Marco Valenzuela",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmW9TWZ2xfUCXgyHEjypb844uWauVlUi5_FfK6b3O_64H5KfkhEoK42BJtHy88_RTgwwBUa9_RiespoxYQTQmELHY858vmlu-W0gbHaPao56sOjO6nASQO7y-axkWzec4_f1elJikIJ2XzjAuo7K_aStty8nDG21_L5LHaTKCEHugPpx32qNuV2_icI8avJqxnyKaUFawBwzLBB62f07jPb2m2mOuutDDoaBVn9ijr-7S_tZbk5y512tRouiQgiUgmIkQotz6yjC0",
    position: "Lead UX Designer",
    score: "5.0 Design Guru",
    status: "Passive Search",
    isAvailable: false,
    skills: ["Figma", "Interaction Design", "React", "Tailwind CSS", "Design Systems"]
  },
  {
    id: "c3",
    name: "Sarah Jenkins",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHtMbvJh9yAghRBKw1rgPwVdWPiLK14pb8UcwlvAXOOnOXS6GTcokEnLY3L1zLNLiBBWO8TVql7Lfq81Ub_XPuYTKwBD_mSNdrqDjRyvfUWHtIi7QPlXfH46Uc9c-okeO-rjRYTWMPUbQtefY2x1bCPtc8KbnQQsaor-eNkAIs0HipNtG0twCis6YzmNoq4KH4L2Q0fTp7PCvzpTCPJj92SVIpOp-DEkJI8Ou_T055S80LhDZz2GrllODq4RZ-Qwc3zwkUvlsNI4M",
    position: "Data Strategy Lead",
    score: "4.8 Analytics Expert",
    status: "Available Now",
    isAvailable: true,
    skills: ["PowerBI", "SQL", "Snowflake", "Python", "Data Governance"]
  }
];

const mockJobs: Job[] = [
  {
    id: "j1",
    company: "Stratus Solutions",
    position: "Principal DevOps Lead",
    salary: "$140k - $180k USD",
    location: "Remote",
    description: "Looking for a veteran cloud architect to spearhead our transition to a multi-cloud Kubernetes environment.",
    skills: ["AWS EKS", "Terraform"],
    icon: <Cloud className="h-6 w-6 text-primary" />
  },
  {
    id: "j2",
    company: "Nova Creative",
    position: "Senior Product Designer",
    salary: "$90k - $120k USD",
    location: "Hybrid (Madrid)",
    description: "Join our elite design squad to redefine the future of fintech mobile experiences. Strong UX focus required.",
    skills: ["Figma", "Design Systems"],
    icon: <Paintbrush className="h-6 w-6 text-primary" />
  },
  {
    id: "j3",
    company: "Quantum Analytics",
    position: "Head of Data Governance",
    salary: "$160k+ USD",
    location: "NYC / Remote",
    description: "High-stakes role managing petabytes of data for Fortune 500 clients. Needs deep Snowflake expertise.",
    skills: ["Snowflake", "Compliance"],
    icon: <Database className="h-6 w-6 text-primary" />
  }
];

export function MatchPanel() {
  const [selectedCandidate, setSelectedCandidate] = React.useState<string | null>(null);
  const [selectedJob, setSelectedJob] = React.useState<string | null>(null);
  const [matchStatus, setMatchStatus] = React.useState<"idle" | "matching" | "success">("idle");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSelectCandidate = (id: string) => {
    if (matchStatus === "matching") return;
    setSelectedCandidate(id === selectedCandidate ? null : id);
    setMatchStatus("idle");
  };

  const handleSelectJob = (id: string) => {
    if (matchStatus === "matching") return;
    setSelectedJob(id === selectedJob ? null : id);
    setMatchStatus("idle");
  };

  const activeCandidate = mockCandidates.find(c => c.id === selectedCandidate);
  const activeJob = mockJobs.find(j => j.id === selectedJob);

  const isMatchedEnabled = selectedCandidate && selectedJob;

  const handleValidateMatch = () => {
    if (!isMatchedEnabled || matchStatus === "matching") return;

    setMatchStatus("matching");
    toast.info("Analizando compatibilidad y ejecutando algoritmo de Match...");

    setTimeout(() => {
      setMatchStatus("success");
      toast.success("¡Match Exitoso!", {
        description: `Se ha vinculado a ${activeCandidate?.name} con la vacante de ${activeJob?.company} de forma exitosa.`,
      });
    }, 1500);
  };

  const filteredCandidates = mockCandidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJobs = mockJobs.filter(j => 
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col gap-6 bg-transparent h-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Dashboard Controls / Stats */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="flex flex-wrap gap-4">
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
            <span className="p-3 bg-primary/10 text-primary rounded-xl">
              <UserSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Talentos Disponibles</p>
              <p className="text-[24px] font-black text-primary leading-none mt-1">124</p>
            </div>
          </Card>
          
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
            <span className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vacantes Urgentes</p>
              <p className="text-[24px] font-black text-amber-500 leading-none mt-1">38</p>
            </div>
          </Card>
        </div>

        {/* Action Hub */}
        <div className="flex flex-col items-center md:items-end justify-center min-w-[280px]">
          <Button
            onClick={handleValidateMatch}
            disabled={!isMatchedEnabled || matchStatus === "matching"}
            className={`px-10 h-14 rounded-full font-bold text-[14px] shadow-lg transition-all duration-500 flex items-center gap-2 cursor-pointer select-none ${
              matchStatus === "success"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 scale-105"
                : isMatchedEnabled
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 scale-105"
                  : "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed shadow-none"
            }`}
          >
            {matchStatus === "matching" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : matchStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                ¡Match Exitoso!
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Validar Match
              </>
            )}
          </Button>
          <p className={`text-[11px] mt-2 font-semibold tracking-tight transition-colors ${
            matchStatus === "success"
              ? "text-emerald-500"
              : isMatchedEnabled
                ? "text-primary"
                : "text-muted-foreground/60"
          }`}>
            {matchStatus === "success"
              ? "¡Vinculación procesada correctamente!"
              : isMatchedEnabled
                ? `Los perfiles muestran un 94% de compatibilidad`
                : "Selecciona un candidato y una vacante para comenzar"}
          </p>
        </div>
      </div>

      {/* Double Column Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pb-12 custom-scrollbar max-h-[calc(100vh-240px)]">
        
        {/* Left: Premium Talent */}
        <div className="flex flex-col gap-5 pr-1.5">
          <div className="flex items-center justify-between sticky top-0 bg-background/90 dark:bg-zinc-950/20 backdrop-blur-md py-3 z-10 border-b border-border/20 mb-1">
            <h3 className="text-[20px] font-bold text-foreground tracking-tight">Profesionales Premium</h3>
            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold text-[11px] px-3 py-1 rounded-full">
              Top 10% Talent
            </Badge>
          </div>

          <div className="space-y-4">
            {filteredCandidates.map((candidate) => {
              const isSelected = selectedCandidate === candidate.id;
              const isSuccess = matchStatus === "success" && isSelected;
              return (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate.id)}
                  className={`bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border p-8 rounded-[24px] cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-900 flex flex-col gap-4 group shadow-xs ${
                    isSuccess
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.01]"
                      : isSelected
                        ? "border-primary ring-2 ring-primary/10 scale-[1.01]"
                        : "border-black/5 dark:border-white/5 hover:border-border/60 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <Avatar className="w-16 h-16 rounded-2xl border border-border/40 shadow-xs">
                        <AvatarImage src={candidate.avatar} className="object-cover" />
                        <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-[16px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {candidate.name}
                        </h4>
                        <p className="text-[13px] font-semibold text-primary mt-1">{candidate.position}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                          <span className="text-[12px] font-medium text-muted-foreground">{candidate.score}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`border-none text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      candidate.isAvailable
                        ? "bg-primary/10 text-primary hover:bg-primary/10"
                        : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:bg-zinc-100"
                    }`}>
                      {candidate.status === "Available Now" ? "Disponible" : "Búsqueda Pasiva"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
                    {candidate.skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="text-[11px] font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-muted-foreground rounded-lg">
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-muted-foreground rounded-lg">
                        +{candidate.skills.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Urgent Vacancies */}
        <div className="flex flex-col gap-5 pr-1.5">
          <div className="flex items-center justify-between sticky top-0 bg-background/90 dark:bg-zinc-950/20 backdrop-blur-md py-3 z-10 border-b border-border/20 mb-1">
            <h3 className="text-[20px] font-bold text-foreground tracking-tight">Vacantes Urgentes</h3>
            <Badge variant="outline" className="bg-rose-500/10 border-rose-500/20 text-rose-500 font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <Bolt className="h-3.5 w-3.5" />
              Soporte Prioritario
            </Badge>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isSelected = selectedJob === job.id;
              const isSuccess = matchStatus === "success" && isSelected;
              return (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  className={`bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border p-8 rounded-[24px] cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-900 flex flex-col gap-4 group shadow-xs ${
                    isSuccess
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.01]"
                      : isSelected
                        ? "border-primary ring-2 ring-primary/10 scale-[1.01]"
                        : "border-black/5 dark:border-white/5 hover:border-border/60 hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-border/40 shrink-0 shadow-xs">
                        {job.icon}
                      </div>
                      <div>
                        <h4 className="text-[16px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                          {job.company}
                        </h4>
                        <p className="text-[13px] font-semibold text-primary mt-1">{job.position}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                          <span className="text-[12px] font-medium text-muted-foreground">{job.salary}</span>
                          <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                          <span className="text-[12px] font-medium text-muted-foreground">{job.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
                    {job.skills.map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="bg-primary/5 hover:bg-primary/5 border-primary/10 text-primary text-[10px] font-semibold px-3 py-1 rounded-full"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Floating Decoration: Ambient Particles (Visual Identity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20 dark:opacity-10">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-secondary/10 blur-[120px] rounded-full"></div>
      </div>

    </div>
  );
}
