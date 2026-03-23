"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import CreateUserModal from "@/components/dashboard/users/create-user-modal";
import CustomSelect from "@/components/checkout/custom-select";
import { useAuth } from "@/lib/auth-context";
import { fetchMerchantUsers, toggleUser, deleteUser, fetchMerchants, fetchRoles, resetUserPassword } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  merchant: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin?: boolean;
};

type MerchantOption = {
  merchant_id: number;
  name: string;
};

type RoleOption = {
  role_id: number;
  name: string;
  is_admin: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isSuperadmin = !!currentUser?.is_superadmin;
  const canAccessManagement = isSuperadmin || !!currentUser?.is_admin;

  const [users, setUsers] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToConfirmResetPassword, setUserToConfirmResetPassword] = useState<User | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  async function loadUsers() {
    if (!currentUser || !canAccessManagement) return;

    if (isSuperadmin && selectedMerchantId === undefined) {
      return;
    }

    try {
      setLoading(true);
      const data = await fetchMerchantUsers(isSuperadmin ? selectedMerchantId : undefined);
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && currentUser && !canAccessManagement) {
      router.replace("/dashboard?denied=users");
      return;
    }

    if (!canAccessManagement) {
      return;
    }

    if (!currentUser) return;

    if (isSuperadmin) {
      setSelectedMerchantId((prev) => (prev === undefined ? 0 : prev));
      return;
    }

    setSelectedMerchantId(undefined);
  }, [authLoading, currentUser, isSuperadmin, canAccessManagement, router]);

  useEffect(() => {
    if (!currentUser || !isSuperadmin || !canAccessManagement) return;

    async function loadMerchants() {
      try {
        const data = await fetchMerchants();
        const mapped = data.map((merchant) => ({
          merchant_id: merchant.merchant_id,
          name: merchant.name,
        }));

        setMerchants(mapped);
      } catch (error) {
        console.error("Error cargando comercios", error);
      }
    }

    loadMerchants();
  }, [currentUser, isSuperadmin]);

  useEffect(() => {
    if (!currentUser || !canAccessManagement) return;

    async function loadRoles() {
      try {
        const data = await fetchRoles(isSuperadmin ? selectedMerchantId : undefined);
        setRoles(data);
      } catch (error) {
        console.error("Error cargando roles", error);
        setRoles([]);
      }
    }

    loadRoles();
  }, [currentUser, isSuperadmin, selectedMerchantId]);

  useEffect(() => {
    setRoleFilter("all");
  }, [selectedMerchantId]);

  useEffect(() => {
    if (!canAccessManagement) return;
    loadUsers();
  }, [currentUser, isSuperadmin, selectedMerchantId, canAccessManagement]);

  useEffect(() => {
    if (!userToResetPassword) {
      setResetPasswordModalOpen(false);
      return;
    }

    const timer = setTimeout(() => setResetPasswordModalOpen(true), 10);
    return () => clearTimeout(timer);
  }, [userToResetPassword]);

  if (!authLoading && currentUser && !canAccessManagement) {
    return null;
  }

  function canManageAdmin(targetUser: User) {
    const isSelf = currentUser?.id === targetUser.id;
    if (isSelf) return false;
    if (!targetUser.is_admin) return true;
    return !!currentUser?.is_superadmin;
  }

  function canResetPassword(targetUser: User) {
    const isSelf = currentUser?.id === targetUser.id;
    if (isSelf) return false;
    return true;
  }

  async function handleToggle(user: User) {
    if (!canManageAdmin(user)) return;
    await toggleUser(user.id, isSuperadmin ? selectedMerchantId : undefined);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      )
    );
  }

  async function handleDeleteUser(user: User) {
    if (!canManageAdmin(user)) return;
    try {
      await deleteUser(user.id, isSuperadmin ? selectedMerchantId : undefined);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Error eliminando usuario", error);
    }
  }

  async function handleConfirmResetPassword() {
    if (!userToConfirmResetPassword) return;

    setResetPasswordLoading(true);
    setResetPasswordError("");

    try {
      const res = await resetUserPassword(
        userToConfirmResetPassword.id,
        resetPasswordValue,
        isSuperadmin ? selectedMerchantId : undefined
      );

      if (res.error) {
        setResetPasswordError(res.error);
        return;
      }

      setUserToResetPassword(null);
      setUserToConfirmResetPassword(null);
      setResetPasswordValue("");
      setResetPasswordError("");
    } catch (error) {
      setResetPasswordError("Error al restablecer la contraseña");
      console.error("Error resetting password", error);
    } finally {
      setResetPasswordLoading(false);
    }
  }

  function closeResetPasswordModal(clearForm: boolean = true) {
    setResetPasswordModalOpen(false);
    setTimeout(() => {
      setUserToResetPassword(null);
      if (clearForm) {
        setResetPasswordValue("");
        setResetPasswordError("");
      }
    }, 200);
  }

  function handleOpenResetConfirmation() {
    if (!userToResetPassword) return;

    if (!resetPasswordValue) {
      setResetPasswordError("La nueva contraseña es requerida");
      return;
    }

    setUserToConfirmResetPassword(userToResetPassword);
    closeResetPasswordModal(false);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setShowCreateModal(true);
  }

  function handleCreate() {
    setEditingUser(null);
    setShowCreateModal(true);
  }

  const merchantOptions = useMemo(() => {
    const uniqueById = new Map<number, MerchantOption>();
    merchants.forEach((merchant) => {
      uniqueById.set(merchant.merchant_id, merchant);
    });

    return Array.from(uniqueById.values()).sort((a, b) => a.merchant_id - b.merchant_id);
  }, [merchants]);

  const merchantName = useMemo(() => {
    if (!isSuperadmin) {
      return users.length > 0 ? users[0].merchant : "Merchant";
    }

    const selected = merchantOptions.find((m) => m.merchant_id === selectedMerchantId);
    return selected?.name || "Merchant";
  }, [isSuperadmin, users, merchantOptions, selectedMerchantId]);

  const roleFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos los roles" },
      ...roles.map((role) => ({ value: role.name, label: role.name })),
    ];
  }, [roles]);

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: "Todos los estados" },
      { value: "active", label: "Activos" },
      { value: "inactive", label: "Inactivos" },
    ],
    []
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Gestión de Usuarios" breadcrumb="Gestión de Usuarios" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 stagger-children">
            {/* Comercio */}
            <GlassCard>
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted-foreground tracking-wider">
                  Empresa
                </p>
                <h2 className="text-xl font-semibold text-foreground">{merchantName}</h2>
              </div>
            </GlassCard>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Usuarios
                  </p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-green-500 uppercase tracking-wider mb-1">
                    Activos
                  </p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-destructive uppercase tracking-wider mb-1">
                    Inactivos
                  </p>
                  <p className="text-2xl font-bold">{inactiveCount}</p>
                </div>
              </GlassCard>
            </div>

            {/* Controles */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                  <Search size={16} className="text-muted-foreground" />
                  <input
                    placeholder="Buscar usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-sm"
                  />
                </div>

                {isSuperadmin && (
                  <div className="min-w-[180px]">
                    <CustomSelect
                      variant="dashboard"
                      value={String(selectedMerchantId ?? 0)}
                      onChange={(value) => setSelectedMerchantId(Number(value))}
                      options={merchantOptions.map((merchant) => ({
                        value: String(merchant.merchant_id),
                        label: merchant.name,
                      }))}
                    />
                  </div>
                )}

                <div className="min-w-[180px]">
                  <CustomSelect
                    variant="dashboard"
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roleFilterOptions}
                  />
                </div>

                <div className="min-w-[180px]">
                  <CustomSelect
                    variant="dashboard"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusFilterOptions}
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                className="text-xs px-4 py-2 rounded-lg bg-primary/15 text-primary font-medium hover:bg-primary/25 transition"
              >
                Agregar Usuario
              </button>
            </div>

            {/* Tabla de usuarios */}
            <GlassCard className="animate-fade-in">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">Usuarios</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left py-3">Nombre</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-left py-3">Rol</th>
                      <th className="text-left py-3">Estado</th>
                      <th className="py-3 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/40">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3 font-medium">{user.full_name}</td>
                        <td className="py-3 text-muted-foreground">{user.email}</td>
                        <td className="py-3 text-muted-foreground">{user.role}</td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-md font-medium",
                              user.is_active
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            {user.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="w-24 text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                            >
                              Editar
                            </button>

                            <button
                              disabled={!canManageAdmin(user)}
                              title={
                                currentUser?.id === user.id
                                  ? "No puedes desactivar tu propio usuario"
                                  : user.is_admin && !currentUser?.is_superadmin
                                  ? "Solo los superadmins pueden desactivar administradores"
                                  : ""
                              }
                              onClick={() => handleToggle(user)}
                              className={cn(
                                "w-24 text-xs px-3 py-1 border rounded-md",
                                !canManageAdmin(user)
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-white/5"
                              )}
                            >
                              {user.is_active ? "Desactivar" : "Activar"}
                            </button>

                            <button
                              disabled={!canResetPassword(user)}
                              title={
                                currentUser?.id === user.id
                                  ? "No puedes restablecer tu propia contraseña desde este módulo"
                                  : ""
                              }
                              onClick={() => {
                                setUserToResetPassword(user);
                                setUserToConfirmResetPassword(null);
                                setResetPasswordValue("");
                                setResetPasswordError("");
                              }}
                              className={cn(
                                "w-28 text-xs px-3 py-1 border rounded-md text-amber-300",
                                !canResetPassword(user)
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-amber-500/10"
                              )}
                            >
                              Contraseña
                            </button>

                            <button
                              disabled={!canManageAdmin(user)}
                              title={
                                currentUser?.id === user.id
                                  ? "No puedes eliminar tu propio usuario"
                                  : user.is_admin && !currentUser?.is_superadmin
                                  ? "Solo los superadmins pueden eliminar administradores"
                                  : ""
                              }
                              onClick={() => setUserToDelete(user)}
                              className={cn(
                                "w-24 text-xs px-3 py-1 border rounded-md text-red-400",
                                !canManageAdmin(user)
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-red-500/10"
                              )}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          selectedMerchantId={isSuperadmin ? selectedMerchantId : undefined}
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onCreated={() => {
            loadUsers();
            setEditingUser(null);
          }}
        />
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl p-6 w-[420px] border border-border/40">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Seguro que deseas eliminar al usuario
              <span className="font-semibold text-white"> {userToDelete.full_name}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="text-xs px-4 py-2 border rounded-md hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  try {
                    await handleDeleteUser(userToDelete);
                    setUserToDelete(null);
                  } catch (error) {}
                }}
                className="text-xs px-4 py-2 rounded-md border border-red-400/30 text-red-300 hover:bg-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {userToResetPassword && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
            resetPasswordModalOpen ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
          }`}
        >
          <div
            className={`w-[420px] rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl p-6 transform transition-all duration-200 ${
              resetPasswordModalOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Restablecer Contraseña</h2>
              <button
                onClick={() => closeResetPasswordModal()}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                x
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Define una nueva contraseña para
              <span className="font-semibold text-white"> {userToResetPassword.full_name}</span>.
            </p>

            <input
              type="password"
              placeholder="Nueva contraseña"
              value={resetPasswordValue}
              onChange={(e) => {
                setResetPasswordValue(e.target.value);
                setResetPasswordError("");
              }}
              className="rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary w-full"
            />

            <p className="text-xs text-muted-foreground mt-2">
              Debe tener al menos 8 caracteres, incluir un número y una letra.
            </p>

            {resetPasswordError && (
              <p className="text-xs text-destructive mt-3">{resetPasswordError}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => closeResetPasswordModal()}
                className="text-xs px-4 py-2 rounded-md border border-border hover:bg-white/5 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleOpenResetConfirmation}
                className="text-xs px-4 py-2 rounded-md bg-primary text-white hover:opacity-90 transition"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      {userToConfirmResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl p-6 w-[420px] border border-border/40">
            <h3 className="text-lg font-semibold mb-2">Confirmar restablecimiento</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Seguro que deseas restablecer la contraseña de
              <span className="font-semibold text-white"> {userToConfirmResetPassword.full_name}</span>?
            </p>

            {resetPasswordError && (
              <p className="text-xs text-destructive mb-4">{resetPasswordError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setUserToConfirmResetPassword(null);
                  setResetPasswordError("");
                }}
                className="text-xs px-4 py-2 border rounded-md hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmResetPassword}
                disabled={resetPasswordLoading}
                className="text-xs px-4 py-2 rounded-md border border-amber-400/30 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordLoading ? "Restableciendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}