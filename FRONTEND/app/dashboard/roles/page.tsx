"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import { fetchRoles, createRole, updateRole, deleteRole } from "@/lib/api";

type Role = {
  role_id: number;
  name: string;
  is_admin: boolean;
};

export default function RolesPage() {

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRole, setNewRole] = useState("");

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => {
        setErrorMessage(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [errorMessage])


  async function loadRoles() {

    try {

      setLoading(true);

      const data = await fetchRoles();

      setRoles(data);

    } catch (error) {

      console.error("Error loading roles", error);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadRoles();

  }, []);

  async function handleCreateRole() {

    if (!newRole.trim()) return;

    try {

      await createRole(newRole);

      setNewRole("");

      loadRoles();

    } catch (error) {

      console.error("Error creating role", error);

    }

  }

  async function handleSaveEdit(role_id: number) {

    if (!editingName.trim()) return

    await updateRole(role_id, editingName)

    setEditingRoleId(null)
    setEditingName("")

    loadRoles()

  }

  async function handleDeleteRole(role_id: number) {

    try {

        setErrorMessage(null)

        await deleteRole(role_id)

        loadRoles()

    } catch (error: any) {

        setErrorMessage(
        "No se puede eliminar este rol porque hay usuarios asignados a él."
        )

    }

    }

  
  return (

    <div className="flex flex-col min-h-screen">

      <DashboardHeader
        title="Gestión de Roles"
        breadcrumb="Roles"
      />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">

        {loading ? (

          <div className="flex items-center justify-center py-12">

            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          </div>

        ) : (

          <>

            {/* Create role */}

            <GlassCard>

              <div className="flex flex-col gap-3">

                <div>

                  <p className="text-xs uppercase text-muted-foreground tracking-wider">
                    Crear Rol
                  </p>

                  <h2 className="text-lg font-semibold">
                    Nuevo Rol
                  </h2>

                </div>

                <div className="flex gap-2">

                  <input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Nombre del rol..."
                    className="glass rounded-lg px-3 py-2 text-sm outline-none"
                  />

                  <button
                    onClick={handleCreateRole}
                    className="text-xs px-4 py-2 rounded-lg bg-primary/15 text-primary font-medium hover:bg-primary/25 transition"
                  >
                    Crear
                  </button>

                </div>

              </div>

            </GlassCard>

            {/* Roles table */}

            <GlassCard>

                <div className="flex justify-between mb-4">

                    <div>
                    {/* <p className="text-xs uppercase text-muted-foreground tracking-wider">
                        Roles
                    </p> */}
                    <h3 className="text-lg font-semibold">
                        Gestión de Roles
                    </h3>
                    </div>

                </div>
                {errorMessage && (

                <div className="mb-4 flex items-center justify-between rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-fade-in">

                    <span>{errorMessage}</span>

                    <button
                    onClick={() => setErrorMessage(null)}
                    className="ml-4 text-red-200 hover:text-white"
                    >
                    ✕
                    </button>

                </div>

                )}

                <table className="w-full text-sm">

                    <thead className="border-b border-border/40 text-xs uppercase text-muted-foreground">

                        <tr>
                            <th className="text-left py-3">Nombre del Rol</th>
                            <th className="text-left py-3">Es Admin</th>
                            <th className="text-right py-3">Acciones</th>
                        </tr>

                    </thead>

                    <tbody className="divide-y divide-border/40">

                    {roles.map((role) => {

                        const isEditing = editingRoleId === role.role_id

                        return (

                        <tr key={role.role_id}>

                            <td className="py-3">

                                {isEditing ? (

                                <input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="glass rounded-md px-2 py-1 text-sm outline-none"
                                />

                                ) : (

                                role.name

                                )}

                            </td>

                            <td className="py-3">
                                {role.is_admin ? "Sí" : "No"}
                            </td>

                            <td className="py-3 text-right flex justify-end gap-2">

                                {isEditing ? (

                                <>
                                    <button
                                    onClick={() => handleSaveEdit(role.role_id)}
                                    className="text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                    >
                                    Guardar
                                    </button>

                                    <button
                                    onClick={() => setEditingRoleId(null)}
                                    className="text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                    >
                                    Cancelar
                                    </button>
                                </>

                                ) : (

                                <>
                                    <button
                                        disabled={role.is_admin}
                                        title={role.is_admin ? "El rol administrador no puede modificarse" : ""}
                                        onClick={() => {
                                        setEditingRoleId(role.role_id)
                                        setEditingName(role.name)
                                        }}
                                        className={`text-xs px-3 py-1 border rounded-md 
                                        ${role.is_admin ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5"}`}
                                    >
                                        Editar
                                    </button>

                                    <button
                                        disabled={role.is_admin}
                                        onClick={() => setRoleToDelete(role)}
                                        className={`text-xs px-3 py-1 border rounded-md 
                                        ${role.is_admin ? "opacity-40 cursor-not-allowed" : "hover:bg-red-500/20 text-red-300 border-red-400/30"}`}
                                    >
                                        Eliminar
                                    </button>
                                </>

                                )}

                            </td>

                        </tr>

                        )

                    })}

                    </tbody>

                </table>

                </GlassCard>

          </>

        )}

      </div>
        {roleToDelete && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">

            <div className="glass rounded-xl p-6 w-[420px] border border-border/40">

            <h3 className="text-lg font-semibold mb-2">
                Confirmar eliminación
            </h3>

            <p className="text-sm text-muted-foreground mb-6">
                ¿Seguro que deseas eliminar el rol
                <span className="font-semibold text-white"> {roleToDelete.name}</span>?
            </p>

            <div className="flex justify-end gap-3">

                <button
                onClick={() => setRoleToDelete(null)}
                className="text-xs px-4 py-2 border rounded-md hover:bg-white/5"
                >
                Cancelar
                </button>

                <button
                onClick={async () => {

                    try {

                    await handleDeleteRole(roleToDelete.role_id)

                    setRoleToDelete(null)

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