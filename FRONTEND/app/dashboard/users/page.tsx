"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import CreateUserModal from "@/components/dashboard/users/create-user-modal";
import CustomSelect from "@/components/checkout/custom-select";
import { useAuth } from "@/lib/auth-context";
import { fetchMerchantUsers, toggleUser, deleteUser } from "@/lib/api";
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

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchMerchantUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function canManageAdmin(targetUser: User) {
    const isSelf = currentUser?.id === targetUser.id;
    if (isSelf) return false;
    if (!targetUser.is_admin) return true;
    return !!currentUser?.is_superadmin;
  }

  async function handleToggle(user: User) {
    if (!canManageAdmin(user)) return;
    await toggleUser(user.id);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      )
    );
  }

  async function handleDeleteUser(user: User) {
    if (!canManageAdmin(user)) return;
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Error deleting user", error);
    }
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setShowCreateModal(true);
  }

  function handleCreate() {
    setEditingUser(null);
    setShowCreateModal(true);
  }

  const merchantName = users.length > 0 ? users[0].merchant : "Merchant";

  const roles = useMemo(() => {
    const unique = new Set(users.map((u) => u.role));
    return ["all", ...Array.from(unique)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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
          <>
            {/* Merchant */}
            <GlassCard>
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted-foreground tracking-wider">
                  Empresa
                </p>
                <h2 className="text-xl font-semibold text-foreground">{merchantName}</h2>
              </div>
            </GlassCard>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* Controls */}
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

                <div className="min-w-[220px]">
                  <CustomSelect
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roles.map((r) => ({
                      value: r,
                      label: r === "all" ? "Todos los roles" : r,
                    }))}
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

            {/* Users table */}
            <GlassCard>
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
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
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
    </div>
  );
}