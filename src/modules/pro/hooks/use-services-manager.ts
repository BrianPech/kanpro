import { useState } from "react";
import { toast } from "sonner";
import { proService } from "../services/pro-service";

export function useServicesManager(initialServices: any[], userId: string) {
  const [services, setServices] = useState(initialServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpenState, setIsDeleteDialogOpenState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    delivery_time: "",
    category: ""
  });

  const openCreateDialog = () => {
    setEditingService(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      delivery_time: "",
      category: ""
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: any) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price.toString(),
      delivery_time: service.delivery_time,
      category: service.category || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.price || !formData.delivery_time) {
      toast.error("Campos requeridos", { description: "Por favor completa todos los campos obligatorios." });
      return;
    }

    setIsSaving(true);
    try {
      if (editingService) {
        // Update
        const data = await proService.updateService(editingService.id, formData);
        setServices(services.map(s => s.id === editingService.id ? data : s));
        toast.success("Servicio actualizado", { description: "Tus cambios han sido guardados." });
      } else {
        // Create
        const data = await proService.createService(userId, formData);
        setServices([data, ...services]);
        toast.success("Servicio creado", { description: "El nuevo servicio ya está disponible en tu perfil." });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Error", { description: error.message || "No se pudo guardar el servicio." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await proService.deleteService(serviceToDelete);
      setServices(services.filter(s => s.id !== serviceToDelete));
      toast.success("Servicio eliminado", { description: "El servicio ha sido removido exitosamente." });
    } catch (error: any) {
      console.error(error);
      toast.error("Error", { description: "No se pudo eliminar el servicio." });
    } finally {
      setIsDeleteDialogOpenState(false);
      setServiceToDelete(null);
    }
  };

  return {
    services,
    isDialogOpen,
    setIsDialogOpen,
    isDeleteDialogOpen: isDeleteDialogOpenState,
    setIsDeleteDialogOpen: setIsDeleteDialogOpenState,
    isSaving,
    editingService,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    setServiceToDelete,
  };
}
