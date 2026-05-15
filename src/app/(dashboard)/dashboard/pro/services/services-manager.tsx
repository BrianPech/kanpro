"use client"

import * as React from "react"
import { useState } from "react"
import { Plus, Edit2, Trash2, Clock, DollarSign, Loader2, Tag, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ServicesManager({ initialServices, userId }: { initialServices: any[], userId: string }) {
  const supabase = createClient()
  const [services, setServices] = useState(initialServices)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [editingService, setEditingService] = useState<any | null>(null)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    delivery_time: "",
    category: ""
  })

  const openCreateDialog = () => {
    setEditingService(null)
    setFormData({
      title: "",
      description: "",
      price: "",
      delivery_time: "",
      category: ""
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (service: any) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      delivery_time: service.delivery_time,
      category: service.category || ""
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.delivery_time) {
      toast.error("Campos requeridos", { description: "Por favor completa todos los campos obligatorios." })
      return
    }

    setIsSaving(true)
    try {
      if (editingService) {
        // Update
        const { data, error } = await supabase
          .from("services")
          .update({
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            delivery_time: formData.delivery_time,
            category: formData.category,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingService.id)
          .select()
          .single()

        if (error) throw error
        setServices(services.map(s => s.id === editingService.id ? data : s))
        toast.success("Servicio actualizado", { description: "Tus cambios han sido guardados." })
      } else {
        // Create
        const { data, error } = await supabase
          .from("services")
          .insert({
            professional_id: userId,
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            delivery_time: formData.delivery_time,
            category: formData.category,
          })
          .select()
          .single()

        if (error) throw error
        setServices([data, ...services])
        toast.success("Servicio creado", { description: "El nuevo servicio ya está disponible en tu perfil." })
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error("Error", { description: error.message || "No se pudo guardar el servicio." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!serviceToDelete) return
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceToDelete)

      if (error) throw error
      setServices(services.filter(s => s.id !== serviceToDelete))
      toast.success("Servicio eliminado", { description: "El servicio ha sido removido exitosamente." })
    } catch (error: any) {
      console.error(error)
      toast.error("Error", { description: "No se pudo eliminar el servicio." })
    } finally {
      setIsDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-card p-6 rounded-[24px] border border-border/50 shadow-sm">
        <div>
          <p className="text-[14px] text-muted-foreground">Tienes {services.length} servicio(s) configurado(s)</p>
        </div>
        <Button onClick={openCreateDialog} className="rounded-full bg-primary text-primary-foreground px-6 shadow-md hover:shadow-primary/20 hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Crear Servicio
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 border border-dashed border-border rounded-[32px] text-center">
          <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-full mb-4">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-2">Aún no tienes servicios</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Crea tu primer servicio para que las empresas puedan contratarte directamente a través de K'anPro.
          </p>
          <Button onClick={openCreateDialog} variant="outline" className="rounded-full">
            Comenzar ahora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="group bg-card rounded-[24px] border border-border/50 shadow-sm hover:border-primary/30 transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">{service.title}</h3>
                  <div className="flex bg-muted/50 rounded-full p-1 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditDialog(service)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setServiceToDelete(service.id); setIsDeleteDialogOpen(true) }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-[14px] text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {service.description}
                </p>

                <div className="flex flex-col gap-3 mt-auto">
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    <span>{service.category || "General"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.delivery_time}</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 p-4 px-6 border-t border-border/50 flex justify-between items-center">
                <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Precio Base</span>
                <div className="flex items-center font-bold text-[18px] text-foreground">
                  <DollarSign className="w-5 h-5 text-primary" />
                  {service.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-8 rounded-[32px]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl">{editingService ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
            <DialogDescription>
              Define los detalles del servicio que vas a ofrecer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            <div className="flex flex-col gap-3">
              <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Título del Servicio *</Label>
              <Input 
                placeholder="Ej: Diseño de Logo Profesional" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="h-[52px] rounded-[16px] bg-muted/30"
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Descripción *</Label>
              <Textarea 
                placeholder="Describe qué incluye tu servicio, entregables y metodología..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-[120px] rounded-[16px] bg-muted/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Precio (USD) *</Label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="h-[52px] pl-10 rounded-[16px] bg-muted/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Tiempo de Entrega *</Label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Ej: 3 a 5 días" 
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                    className="h-[52px] pl-10 rounded-[16px] bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-[12px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Categoría (Opcional)</Label>
              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Ej: Branding, Desarrollo Web" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="h-[52px] pl-10 rounded-[16px] bg-muted/30"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button variant="ghost" className="rounded-full px-6" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-full px-8 bg-primary">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingService ? "Actualizar" : "Crear Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio será eliminado permanentemente de tu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-full px-6">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-full px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
