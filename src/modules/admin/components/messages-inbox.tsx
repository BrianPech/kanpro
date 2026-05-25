"use client";

import * as React from "react";
import { 
  Search, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Image as ImageIcon, 
  Download, 
  CheckCheck,
  Send,
  MessageSquare,
  BadgeAlert,
  Sparkles,
  Calendar,
  Briefcase,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface MessageItem {
  id: string;
  name: string;
  avatar: string;
  roleBadge: string;
  time: string;
  subject: string;
  snippet: string;
  isOnline: boolean;
  messages: {
    sender: "incoming" | "outgoing";
    text: string;
    time: string;
  }[];
  applications: {
    company: string;
    status: "Reviewing" | "Pending" | "Hired" | "Rejected";
    position: string;
    progress: number;
  }[];
  skills: string[];
  experience: {
    title: string;
    company: string;
    period: string;
    isActive: boolean;
  }[];
}

const mockInquiries: MessageItem[] = [
  {
    id: "1",
    name: "Mateo Ricci",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbfJc4JAWQBjzBeCCb5AWFHrPQmkpZEAgYnPs9QNEhQsRYFtf8QeWEVup-QcktATUBNR7V_DRGjTw9WIvF3X6FrG5jzXkWTkU0CIv3sOBm5z3ob0uCP4OmWf7VDUtYQLiNAZPyfiUQtmps8Lrx3fEA_ziPKiqK6A8iBT4Gh1zYMSlB2pzTK5TOVpDHjbLEaKyR2SnWK5VkEioTH_GPg5Z4M8jdZ5JvDhTUzI4cYmykLczKXk_hoDvsCa9hWRKj8rFP7Mj-zTeJX28",
    roleBadge: "Pro Premium",
    time: "14:20",
    subject: "Discrepancy in Q4 Tech Validation",
    snippet: "The evaluation criteria for the React ecosystem seems to miss the latest Concurrent features...",
    isOnline: true,
    messages: [
      {
        sender: "incoming",
        text: "The evaluation criteria for the React ecosystem seems to miss the latest Concurrent features in the Technical Validation round. My score doesn't reflect my experience with Suspense and Transitions.",
        time: "14:20"
      },
      {
        sender: "outgoing",
        text: "Hello Mateo, thank you for bringing this to our attention. Our validation engine was updated last week, but I'll manually trigger a review of your React assessment with our technical lead.",
        time: "14:35"
      },
      {
        sender: "incoming",
        text: "That would be great. I have the project repo ready if you need further evidence of those implementations.",
        time: "14:40"
      }
    ],
    applications: [
      { company: "Stark Industries", status: "Reviewing", position: "Senior Fullstack Engineer", progress: 66 },
      { company: "Wayne Corp", status: "Pending", position: "Security Architect", progress: 30 },
      { company: "Globex", status: "Hired", position: "Lead React Dev (Q1 2023)", progress: 100 }
    ],
    skills: ["React v18", "TypeScript", "Node.js", "Next.js", "GraphQL", "AWS Lambda"],
    experience: [
      { title: "Lead Developer", company: "TechFlow Solutions", period: "2020 - Pres.", isActive: true },
      { title: "Senior Engineer", company: "DataViz Labs", period: "2017 - 2020", isActive: false }
    ]
  },
  {
    id: "2",
    name: "Sarah Jenkins",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCic4VcNty7ZUcbxvCXrpenl9MK4EsoPgYPl6LRT45FiAkOlgJ2iSzgfW4UduFonQdgYnMfkELyCf_5FeyYKcs6FCjBJGHgBjTGJxFpP7A69Az8yLLrw-U9BTdq4U6EubS6B8DZPypS4sQ8iVHGj0xCkp7iRuZOAgG24_Os7cSJjUsQOFKsULk4TThXqz3HESxO9ix7-wLYHie6gP8-8cjZ4R5KhTdgR70rbuZ5nrx_fxkDMF3c6Wh7p-LiQZfP-Re8D-A_EFsDv_0",
    roleBadge: "Pro Premium",
    time: "11:05",
    subject: "Profile visibility issue",
    snippet: "I am unable to see my latest certification badges on the public profile view...",
    isOnline: false,
    messages: [
      {
        sender: "incoming",
        text: "I am unable to see my latest certification badges on the public profile view after uploading them yesterday.",
        time: "11:05"
      },
      {
        sender: "outgoing",
        text: "Hi Sarah, can you tell us which certifications you added? Let me verify if they were correctly indexed in our cache.",
        time: "11:15"
      },
      {
        sender: "incoming",
        text: "Sure, it was the AWS Certified Solutions Architect and Scrum Master.",
        time: "11:22"
      }
    ],
    applications: [
      { company: "Stark Industries", status: "Pending", position: "Cloud Native Engineer", progress: 20 },
      { company: "Wayne Corp", status: "Hired", position: "Scrum Master & Architect", progress: 100 }
    ],
    skills: ["AWS Cloud", "Angular", "Node.js", "Agile", "Scrum Master", "CI/CD"],
    experience: [
      { title: "Senior Architect", company: "CloudNative", period: "2019 - Pres.", isActive: true }
    ]
  },
  {
    id: "3",
    name: "Arjun Mehta",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHwJrniO9MroUHJ6f-JBtsGXQG3NAHGN1cT6WMqOLhhzlIrCT6wL6O5LrLTMbsKdnEiLhEl6QIJ5VLB15smo1Dgzg-cTmDIaIsZ3uJ8LfUa1MTBjX4nTSGOnCnr124W1qPotQX6nWKspJ7oKN1FRDHjvRtg46SLTPEDbH9X4ZYdtnrrTfPWMXEyWKLydOx_BIMUZoPbHTMXwYAuMyTwgwpgyrIPCi4FjB_fNPV1xrh7vXia_HiXZVd_nzeL8Lp4epzb_3eVVWbUlw",
    roleBadge: "Pro Premium",
    time: "Ayer",
    subject: "Bulk application status",
    snippet: "Is there a way to export my current application history to a CSV file for my records?",
    isOnline: true,
    messages: [
      {
        sender: "incoming",
        text: "Is there a way to export my current application history to a CSV file for my records? I have applied to multiple vacancies.",
        time: "Ayer"
      },
      {
        sender: "outgoing",
        text: "Hello Arjun! We don't have a direct CSV button for candidates yet, but I can export it for you manually from the admin panel.",
        time: "Ayer"
      },
      {
        sender: "incoming",
        text: "That would be highly appreciated, thanks a lot!",
        time: "Ayer"
      }
    ],
    applications: [
      { company: "Stark Industries", status: "Hired", position: "Senior Python Lead", progress: 100 },
      { company: "Wayne Corp", status: "Rejected", position: "DevOps Engineer", progress: 0 }
    ],
    skills: ["Python", "Django", "PostgreSQL", "Kubernetes", "Docker", "DevOps"],
    experience: [
      { title: "DevOps Lead", company: "Automate Corp", period: "2018 - Pres.", isActive: true }
    ]
  }
];

export function MessagesInbox() {
  const [inquiries, setInquiries] = React.useState<MessageItem[]>(mockInquiries);
  const [selectedId, setSelectedId] = React.useState<string>("1");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [rightTab, setRightTab] = React.useState<"postulaciones" | "perfil">("postulaciones");
  const [replyText, setReplyText] = React.useState("");
  const [chatEndRef, setChatEndRef] = React.useState<HTMLDivElement | null>(null);

  // Get active inquiry
  const activeInquiry = inquiries.find((i) => i.id === selectedId) || inquiries[0];

  // Scroll to bottom of message feed when active conversation changes or new message is added
  React.useEffect(() => {
    if (chatEndRef) {
      chatEndRef.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedId, activeInquiry?.messages?.length, chatEndRef]);

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inq) =>
    inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inq.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!replyText.trim()) return;

    const timeString = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id === selectedId) {
          return {
            ...inq,
            snippet: replyText,
            time: "Ahora",
            messages: [
              ...inq.messages,
              {
                sender: "outgoing",
                text: replyText,
                time: timeString,
              },
            ],
          };
        }
        return inq;
      })
    );

    setReplyText("");
    toast.success("Mensaje enviado con éxito");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownloadRecord = () => {
    toast.info(`Descargando expediente completo de ${activeInquiry.name}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hired":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-500/20";
      case "Reviewing":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-500/20";
      case "Rejected":
        return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500 border border-rose-500/20";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-500/20";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-grow w-full border border-border/40 rounded-[24px] overflow-hidden bg-card/50 backdrop-blur-xl h-[calc(100vh-140px)] shadow-lg">
      
      {/* Left (35%): Message List */}
      <section className="w-full lg:w-[35%] border-r border-border/40 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/20 h-full">
        <div className="p-6 border-b border-border/40 flex justify-between items-center bg-white/40 dark:bg-zinc-900/10 backdrop-blur-md">
          <h2 className="text-[20px] font-bold text-foreground tracking-tight">Consultas</h2>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold text-[11px] px-2.5 py-0.5 rounded-full">
            {inquiries.length} Activas
          </Badge>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-border/30 bg-white/20 dark:bg-zinc-900/5">
          <div className="flex items-center gap-2 text-muted-foreground bg-white/80 dark:bg-zinc-900/40 rounded-full h-10 px-4 border border-border/40">
            <Search className="w-4 h-4 flex-shrink-0" />
            <input
              placeholder="Buscar por candidato, asunto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground w-full h-full focus:outline-none"
            />
          </div>
        </div>

        {/* Message Items Scrollable Container */}
        <div className="overflow-y-auto flex-grow divide-y divide-border/20 custom-scrollbar">
          {filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[14px] text-muted-foreground font-medium">No se encontraron consultas</p>
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const isSelected = inq.id === selectedId;
              return (
                <div
                  key={inq.id}
                  onClick={() => setSelectedId(inq.id)}
                  className={`p-6 border-l-4 cursor-pointer transition-all hover:bg-muted/40 relative ${
                    isSelected 
                      ? "border-primary bg-primary/5 dark:bg-primary/10" 
                      : "border-transparent bg-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-bold text-foreground truncate">{inq.name}</span>
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm tracking-wider uppercase flex-shrink-0">
                        {inq.roleBadge}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-semibold flex-shrink-0">{inq.time}</span>
                  </div>
                  <p className={`text-[13px] mb-1 truncate ${isSelected ? "font-bold text-primary" : "font-semibold text-foreground"}`}>
                    {inq.subject}
                  </p>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {inq.snippet}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Center (40%): Conversation Area */}
      <section className="hidden lg:flex w-[40%] flex-col bg-white dark:bg-zinc-900/20 h-full border-r border-border/40">
        
        {/* Conversation Header */}
        <div className="p-6 border-b border-border/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-12 h-12 rounded-full border border-border/50">
                <AvatarImage src={activeInquiry.avatar} alt={activeInquiry.name} className="object-cover" />
                <AvatarFallback>{activeInquiry.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              {activeInquiry.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-foreground leading-tight">{activeInquiry.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeInquiry.isOnline ? "En línea ahora" : "Desconectado"} • Hora Local: 14:45
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-grow overflow-y-auto p-8 flex flex-col gap-6 bg-zinc-50/20 dark:bg-zinc-950/5 custom-scrollbar">
          <div className="flex flex-col items-center">
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-border/30 bg-muted/20 px-3 py-1 rounded-full">
              Hoy, Mayo 2026
            </Badge>
          </div>

          {activeInquiry.messages.map((msg, index) => {
            const isOutgoing = msg.sender === "outgoing";
            return (
              <div 
                key={index} 
                className={`flex gap-3 max-w-[85%] ${isOutgoing ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {!isOutgoing && (
                  <Avatar className="w-8 h-8 rounded-full flex-shrink-0 border border-border/40 self-end mb-4">
                    <AvatarImage src={activeInquiry.avatar} className="object-cover" />
                    <AvatarFallback>{activeInquiry.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col">
                  <div className={`p-4 rounded-[20px] shadow-xs leading-relaxed text-[13.5px] ${
                    isOutgoing 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-zinc-100 dark:bg-zinc-800/60 text-foreground rounded-tl-none border border-border/10"
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1.5 ${isOutgoing ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-muted-foreground/60 font-semibold">{msg.time}</span>
                    {isOutgoing && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Scroll ref element */}
          <div ref={(el) => setChatEndRef(el)} />
        </div>

        {/* Message Input Form */}
        <div className="p-6 border-t border-border/40 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md">
          <div className="flex flex-col gap-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full border-none bg-zinc-50 dark:bg-zinc-950/40 rounded-xl p-4 text-[13px] text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20 resize-none transition-all outline-none border border-border/30 dark:border-border/10"
              placeholder="Escribe tu respuesta aquí..."
              rows={3}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => toast.info("Nota interna guardada (solo para administradores)")}
                  className="px-5 h-9 rounded-full text-[12px] font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-all"
                >
                  Nota Interna
                </Button>
                <Button 
                  onClick={handleSend}
                  className="px-6 h-9 rounded-full text-[12px] font-bold bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-1.5"
                >
                  Enviar
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right (25%): Integrated Operational Record (Expediente) */}
      <section className="hidden lg:flex w-[25%] bg-zinc-50/20 dark:bg-zinc-950/10 flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-border/40 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-md">
          <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
            <BadgeAlert className="h-3.5 w-3.5 text-primary" />
            Expediente Candidato
          </h3>
          <div className="flex bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full border border-border/40">
            <button 
              className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
                rightTab === "postulaciones" 
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setRightTab("postulaciones")}
            >
              <Briefcase className="h-3 w-3" />
              Postulaciones
            </button>
            <button 
              className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
                rightTab === "perfil" 
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setRightTab("perfil")}
            >
              <Award className="h-3 w-3" />
              Perfil Técnico
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white/20 dark:bg-zinc-900/5">
          
          {/* Postulaciones Tab */}
          {rightTab === "postulaciones" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[13px] font-bold text-foreground">Postulaciones Recientes</h4>
                  <span className="text-[11px] text-primary font-bold hover:underline cursor-pointer">Ver todo</span>
                </div>
                <div className="space-y-4">
                  {activeInquiry.applications.map((app, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white dark:bg-zinc-900/60 p-4 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] shadow-xs hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="text-[12px] font-bold text-foreground truncate">{app.company}</span>
                        <Badge className={`${getStatusColor(app.status)} text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wide flex-shrink-0 uppercase`}>
                          {app.status === "Hired" 
                            ? "Contratado" 
                            : app.status === "Reviewing" 
                              ? "En revisión" 
                              : app.status === "Pending" 
                                ? "Pendiente" 
                                : "Rechazado"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2 truncate">{app.position}</p>
                      {app.progress > 0 && (
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              app.status === "Hired" 
                                ? "bg-emerald-500" 
                                : app.status === "Reviewing" 
                                  ? "bg-amber-400" 
                                  : "bg-blue-500"
                            }`} 
                            style={{ width: `${app.progress}%` }} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Perfil Técnico Tab */}
          {rightTab === "perfil" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <h4 className="text-[13px] font-bold text-foreground mb-3">Habilidades Clave</h4>
                <div className="flex flex-wrap gap-2">
                  {activeInquiry.skills.map((skill, idx) => (
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
              
              <div>
                <h4 className="text-[13px] font-bold text-foreground mb-4">Experiencia Profesional</h4>
                <div className="relative pl-4 border-l border-border/60 space-y-6">
                  {activeInquiry.experience.map((exp, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        exp.isActive ? "bg-primary" : "bg-muted-foreground/40"
                      }`} />
                      <h5 className="text-[12px] font-bold text-foreground leading-tight">{exp.title}</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {exp.company} • {exp.period}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-6 bg-white dark:bg-zinc-900 border-t border-border/40 mt-auto flex items-center justify-center">
          <Button 
            onClick={handleDownloadRecord}
            className="w-full py-5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-primary hover:text-primary/90 font-bold text-[11px] rounded-xl transition-all border border-border/40 gap-2 cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" />
            Descargar Historial Completo
          </Button>
        </div>
      </section>

    </div>
  );
}
