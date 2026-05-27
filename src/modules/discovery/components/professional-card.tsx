"use client"
 
import * as React from "react"
import { MapPin, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Professional } from "../data/mock"
import { toast } from "sonner"
 
export function ProfessionalCard({
  professional: pro,
}: {
  professional: Professional
}) {
  // High fidelity mapping helper
  const details = React.useMemo(() => {
    switch (pro.id) {
      case "pro-1":
        return {
          name: "Carlos Mendoza",
          title: "Frontend Specialist (React/Next.js)",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqfqdGBDjmjOdkZJj0CYvYcj9IDjSaydn2gFez4bb5kx_yIguSKzqFHV-ZU0EZF6b4D2aWsEDWb51VchJ0H66uMbXGd5rri4jQo2hg0jvI3PZ_CuukC8T9tB99Kppvezyy2S-NsJWszA-PHbubSJrqzMdTvcb4QzVOuMQUF_KdCnTSE3ty-B7N8k23PAsEssKWgxL7o09WK3oXbJgyOJVuUWurijUcSgngCpjfYVLVCniaitcWiCRnGs99avdocSWQ-0iXtWwEXZw",
          match: "92%"
        }
      case "pro-2":
        return {
          name: "Marina Silva",
          title: "Lead Product Designer",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGFOSqziJyYmqUuIMvk1WkLvLTHJU3n2J0Ef6627i-wMkGrVrlQSGnU1O6c0dBBO9yyCaBDWjTSrWWMbBzapSWsG7rwSDie7Elv335BOYVII3dn2sBw391gUA_3Yz-LsJSXIU8ZB8hVYFF7Fu9vC8Bta_YeAuyjHzB_xfQa7ZdO5G1g5sEiUQ4eHmtlxhKKxEyHvYNup06tpHFBtWi-v1D6lym7NvZMEGv2XQtQOfxEWW4U5SDUE9F2TjgsyQE9M-x6sCoIEoXgms",
          match: "89%"
        }
      case "pro-3":
        return {
          name: "Jorge Villanueva",
          title: "DevOps Engineer",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzzjAklpjolQs8954zuOCrccwfQxHbl9rW9xI1ckAkKQnN5esDVZ_TOlSSH7A0pCKN_ml7d-PcfT9HPjhZY6ywd4UWISCHmOVNPlXtM76Ote4dPsOM0ErR4PQNeGQThw49hZ-fAYwSbQMIUnrPYMdtJ_kHwEB73Qw7JHXIvy6nnvyrXrF1J2ajUIph8LUBAmsZ9Yjq-xrLodU_VflEqOE3xdA3n2WcPANpFNwjCSz-5jRR1V0IPzFca6eOK3wD1zrmwUg5Pqrqsec",
          match: "87%"
        }
      case "pro-6":
        return {
          name: "Elena Rodríguez",
          title: "Senior Backend Engineer & Cloud Architect",
          avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHXRn6E9Gg1yogaTbKvRulorOuHrDHWA8VeHHHkZT6TReM3dFGVNt0aYRoxWWqXfrvLstXU80eCijL-Xu23adcbx7gJBqdJA1XXNym8vyvlah_Cc23ShZmsMEdQJxFi4yhCLe_xtjpLTjALuthlRrPLR9if_X3-AM_qSJ22co4pzcJYfzpFw-WupqniCuorskMUa_YfhP2naIGSj0g6zherBY4a518fG9NBZguI3Jrg09DvLCK63RSZ50Qqd0FsCfdMXXFcKI0O4w",
          match: "98%"
        }
      default:
        return {
          name: pro.name,
          title: pro.title,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${pro.name}`,
          match: `${Math.round(pro.rating * 20)}%`
        }
    }
  }, [pro])
 
  const handleContact = () => {
    toast.success("Mensaje enviado", {
      description: `Se ha abierto un canal de comunicación directa con ${details.name}.`,
    })
  }
 
  const handleViewProfile = () => {
    toast.info("Cargando perfil...", {
      description: `Abriendo el portafolio y experiencia detallada de ${details.name}.`,
    })
  }
 
  return (
    <div className="glass-card p-6 rounded-[28px] border border-border/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[360px] relative overflow-hidden bg-card">
      <div>
        
        {/* Top Header Row with avatar and Match score */}
        <div className="flex justify-between items-start mb-5">
          <div className="relative size-16 rounded-2xl overflow-hidden border border-border/40 bg-muted shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
            <img 
              alt={details.name} 
              className="w-full h-full object-cover" 
              src={details.avatarUrl} 
            />
            {pro.available && (
              <span className="absolute bottom-1 right-1 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
 
          <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-extrabold px-3 py-1 rounded-lg text-xs tracking-wide">
            {details.match} Match
          </span>
        </div>
 
        {/* Professional metadata info */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors tracking-tight">
              {details.name}
            </h4>
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              <Star className="size-3 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{pro.rating}</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-350 font-medium">
            {details.title}
          </p>
        </div>
 
        {/* Location marker info */}
        <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <MapPin className="size-3.5 text-slate-400" />
          <span>{pro.location}</span>
        </div>
 
        {/* Skills capsules tag list */}
        <div className="mt-5 flex flex-wrap gap-1.5 overflow-hidden max-h-16 py-0.5">
          {pro.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="h-6 rounded-full border-0 bg-slate-500/10 dark:bg-slate-500/20 px-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide"
            >
              {skill}
            </Badge>
          ))}
        </div>
 
      </div>
 
      {/* 2-column actions grid */}
      <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/40 shrink-0">
        <Button 
          onClick={handleContact}
          className="bg-primary hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm"
        >
          Contactar
        </Button>
        <Button 
          onClick={handleViewProfile}
          variant="outline" 
          className="bg-card border-border/60 hover:bg-muted text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all"
        >
          Ver Perfil
        </Button>
      </div>
 
    </div>
  )
}
