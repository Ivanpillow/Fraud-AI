"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import { useAuth } from "@/lib/auth-context";
import { updateUserProfile, changeUserPassword } from "@/lib/api";
import { Mail, Building2, Shield, User as UserIcon, Lock } from "lucide-react";

import { sanitizeInput, validateFullName, validatePassword } from "@/lib/auth-validation"

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateUserName } = useAuth();

  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
    }
  }, [user]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");

    if (!fullName.trim()) {
      setNameError("El nombre no puede estar vacío");
      return;
    }

    if (fullName.trim() === user?.name) {
      setNameError("El nuevo nombre debe ser diferente al actual");
      return;
    }

    const sanitizedFullName = sanitizeInput(fullName.trim());
    if (!validateFullName(sanitizedFullName)) {
      setNameError("El nombre completo no es válido");
      return;
    }

    const fullNameError = validateFullName(sanitizedFullName);
    if (fullNameError) {
      setNameError(fullNameError);
      return;
    }



    setLoadingName(true);
    try {
      const response = await updateUserProfile(fullName.trim());
      if (response.error) {
        setNameError(response.error || "Error al actualizar el nombre");
      } else {
        updateUserName(fullName.trim());
        setNameSuccess("Nombre actualizado exitosamente");
        setEditingName(false);
        setTimeout(() => setNameSuccess(""), 3000);
      }
    } catch (error) {
      setNameError("Error al actualizar el nombre");
      console.error(error);
    } finally {
      setLoadingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validaciones
    if (!currentPassword) {
      setPasswordError("Ingrese su contraseña actual");
      return;
    }

    if (!newPassword) {
      setPasswordError("Ingrese la nueva contraseña");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("La nueva contraseña no puede ser igual a la actual");
      return;
    }

    const pwValidationError = validatePassword(newPassword);
    if (pwValidationError) {
      setPasswordError(pwValidationError);
      return;
    }

    setLoadingPassword(true);
    try {
      const response = await changeUserPassword(currentPassword, newPassword);
      if (response.error) {
        setPasswordError(response.error || "Error al cambiar la contraseña");
      } else {
        setPasswordSuccess("Contraseña actualizada exitosamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 3000);
      }
    } catch (error) {
      setPasswordError("Error al cambiar la contraseña");
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <DashboardHeader title="Perfil" breadcrumb="Perfil de Usuario" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader title="Perfil" breadcrumb="Perfil de Usuario" />

      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 stagger-children">
            
          <GlassCard title="Información Personal" className="animate-fade-in">
            <div className="space-y-4">

              <div className="flex items-start justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Nombre Completo
                    </p>
                    <p className="text-sm text-foreground font-medium">{user.name}</p>
                  </div>
                </div>
                {!editingName && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Editar
                  </button>
                )}
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Correo Electrónico
                    </p>
                    <p className="text-sm text-foreground font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Comercio
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {user.merchant_name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Rol
                    </p>
                    <p className="text-sm text-foreground font-medium capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Editar Perfil */}
          {editingName && (
            <GlassCard title="Editar Nombre" className="animate-fade-in">
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Nuevo Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setNameError("");
                    }}
                    placeholder="Ingrese su nuevo nombre"
                    className="w-full glass-input rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                {nameError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-xs text-destructive">{nameError}</p>
                  </div>
                )}

                {nameSuccess && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-primary">{nameSuccess}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loadingName}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {loadingName ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setFullName(user.name || "");
                      setNameError("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-foreground hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {/* Cambiar Contraseña */}
          <GlassCard title="Cambiar Contraseña" className="animate-fade-in">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Ingrese su contraseña actual"
                    className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Ingrese su nueva contraseña (mínimo 8 caracteres)"
                    className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Confirme su nueva contraseña"
                    className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs text-destructive">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-xs text-primary">{passwordSuccess}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPassword}
                className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loadingPassword ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          </GlassCard>

          
        </div>
      </div>
    </div>
  );
}
