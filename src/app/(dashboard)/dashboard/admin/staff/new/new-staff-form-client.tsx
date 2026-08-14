"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, UserPlus, Shield, Key, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ALL_PERMISSIONS,
  SUB_ROLE_LABELS,
  type AdminSubRole,
  type AdminPermissionKey,
} from "@/modules/admin/types/staff";
import { createAdminStaffMember } from "@/app/(dashboard)/dashboard/admin/staff/actions";

export function NewStaffFormClient() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  const [department, setDepartment] = React.useState("Operaciones");
  const [subRole, setSubRole] = React.useState<AdminSubRole>("ops_admin");
  const [permissions, setPermissions] = React.useState<AdminPermissionKey[]>(
    SUB_ROLE_LABELS.ops_admin.defaultPermissions
  );
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubRoleChange = (role: AdminSubRole) => {
    setSubRole(role);
    setPermissions(SUB_ROLE_LABELS[role].defaultPermissions);
  };

  const togglePermission = (key: AdminPermissionKey) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Por favor ingrese el nombre y correo del administrador.");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Ingrese una dirección de correo válida (ej. usuario@kanpro.com).");
      return;
    }

    if (!password) {
      toast.error("Ingrese una contraseña inicial para que el administrador pueda acceder.");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden. Verifique ambas claves.");
      return;
    }

    setSubmitting(true);

    try {
      await createAdminStaffMember({
        name,
        email,
        password,
        whatsappNumber,
        subRole,
        department,
        permissions,
        notes,
      });

      toast.success(`Personal ${name} dado de alta exitosamente con credenciales de acceso.`);
      router.push("/dashboard/admin/staff");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al registrar el personal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-16">
      
      {/* 1. Main Auth-Cohesive Registration Card */}
      <div className="w-full bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_16px_40px_rgba(31,39,50,0.08)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] border border-[#d2dbe5]/50 dark:border-zinc-800/80 p-6 sm:p-10 flex flex-col gap-6">
        
        {/* Card Title Header */}
        <div className="flex flex-col gap-1 border-b border-[#d2dbe5]/40 dark:border-zinc-800 pb-4">
          <h2 className="text-[22px] font-extrabold text-[#1f2732] dark:text-zinc-50 tracking-[-0.5px] flex items-center gap-2.5">
            <Shield className="size-6 text-[#1f2732] dark:text-zinc-200" />
            <span>Ficha de Registro y Credenciales de Acceso</span>
          </h2>
          <p className="text-[13px] font-medium text-[#5c7c9b] dark:text-zinc-400">
            Cree la cuenta administrativa asignando su clave de inicio de sesión y atribuciones.
          </p>
        </div>

        {/* Section A: Identification & Credentials */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[14px] font-bold text-[#3e546d] dark:text-zinc-300 tracking-[-0.2px]">
            Información de Usuario y Acceso
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-name" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Nombre Completo *
              </label>
              <input
                id="staff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Ana María Gómez"
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
              />
            </div>

            {/* Email */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-email" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Correo Institucional (Login) *
              </label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="agomez@kanpro.com"
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Password */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-password" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Contraseña de Acceso *
              </label>
              <div className="relative flex items-center">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-confirm-password" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Confirmar Contraseña *
              </label>
              <input
                id="staff-confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repita la clave inicial"
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            
            {/* Phone */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-phone" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Teléfono / WhatsApp
              </label>
              <input
                id="staff-phone"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+52 999 123 4567"
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
              />
            </div>

            {/* Department */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40">
              <label htmlFor="staff-dept" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Departamento / Área *
              </label>
              <input
                id="staff-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                placeholder="Operaciones"
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0"
              />
            </div>

            {/* Role Select */}
            <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-[#5c7c9b]/40 flex flex-col justify-center">
              <label htmlFor="staff-role" className="block text-[12px] font-semibold text-[#3e546d] dark:text-zinc-400 select-none">
                Rol Administrativo *
              </label>
              <select
                id="staff-role"
                value={subRole}
                onChange={(e) => handleSubRoleChange(e.target.value as AdminSubRole)}
                className="w-full bg-transparent border-none outline-none p-0 text-[15px] font-semibold text-[#1f2732] dark:text-zinc-100 focus:ring-0 cursor-pointer"
              >
                <option value="ops_admin">Admin de Operaciones</option>
                <option value="verification_admin">Agente de Verificación</option>
                <option value="support">Soporte Técnico</option>
                <option value="content_admin">Admin de Contenido</option>
                <option value="super_admin">Super Administrador</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section B: Granular Permissions Matrix */}
        <div className="flex flex-col gap-4 pt-2 border-t border-[#d2dbe5]/40 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#3e546d] dark:text-zinc-300 tracking-[-0.2px] flex items-center gap-2">
              <Key className="size-4 text-[#5c7c9b]" />
              <span>Matriz de Permisos Granulares</span>
            </h3>
            <Badge variant="outline" className="text-[11px] font-semibold bg-[#f5f7fa] text-[#1f2732] border-[#d2dbe5]/60">
              {permissions.length} de {ALL_PERMISSIONS.length} Permisos Asignados
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_PERMISSIONS.map((perm) => {
              const isChecked = permissions.includes(perm.key);
              return (
                <div
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`p-4 rounded-[16px] border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isChecked
                      ? "border-[#1f2732] bg-[#f5f7fa] dark:bg-zinc-800/80 shadow-xs"
                      : "border-transparent bg-[#f5f7fa]/60 dark:bg-zinc-900/50 hover:bg-[#f5f7fa]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[13px] text-[#1f2732] dark:text-zinc-100 flex items-center gap-2">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(val) => {
                          const checked = Boolean(val);
                          setPermissions((prev) =>
                            checked
                              ? Array.from(new Set([...prev, perm.key]))
                              : prev.filter((p) => p !== perm.key)
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {perm.label}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#5c7c9b]">
                      {perm.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#5c7c9b] dark:text-zinc-400 leading-relaxed pl-6">
                    {perm.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section C: Internal Notes */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#d2dbe5]/40 dark:border-zinc-800">
          <label htmlFor="staff-notes" className="block text-[13px] font-bold text-[#3e546d] dark:text-zinc-300">
            Notas u Observaciones Internas
          </label>
          <div className="bg-[#f5f7fa] dark:bg-zinc-900/80 rounded-[16px] px-5 py-3 border border-transparent focus-within:border-[#5c7c9b]/40">
            <textarea
              id="staff-notes"
              placeholder="Ingrese notas sobre el alta de este personal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent border-none outline-none p-0 text-[14px] text-[#1f2732] dark:text-zinc-100 placeholder:text-[#aabccf] focus:ring-0 min-h-[70px] resize-none"
            />
          </div>
        </div>

        {/* Form Action Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#d2dbe5]/40 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/staff")}
            className="w-full sm:w-auto h-[48px] px-6 rounded-[16px] border border-[#d2dbe5] dark:border-zinc-700 hover:bg-[#f5f7fa] text-[#1f2732] dark:text-zinc-200 font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="size-4" />
            <span>Cancelar</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto h-[48px] px-8 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[15px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin text-white/80" />
                <span>Creando Cuenta...</span>
              </>
            ) : (
              <>
                <UserPlus className="size-4 text-white" />
                <span>Registrar Personal y Crear Acceso</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
