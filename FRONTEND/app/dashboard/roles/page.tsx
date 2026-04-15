"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import CustomSelect from "@/components/checkout/custom-select";
import { fetchRoles, createRole, updateRole, deleteRole, fetchMerchants } from "@/lib/api";
import { sanitizeInput, validateRoleName } from "@/lib/auth-validation";
import { useAuth } from "@/lib/auth-context";

type Role = {
  role_id: number;
  name: string;
  is_admin: boolean;
};

type MerchantOption = {
  merchant_id: number;
  name: string;
};

export default function RolesPage() {
  const router = useRouter()
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isSuperadmin = !!currentUser?.is_superadmin;
  const canAccessManagement = isSuperadmin || !!currentUser?.is_admin;

  const [roles, setRoles] = useState<Role[]>([]);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [newRole, setNewRole] = useState("");
  const [newRoleIsAdmin, setNewRoleIsAdmin] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const merchantOptions = useMemo(() => {
    const uniqueById = new Map<number, MerchantOption>()
    merchants.forEach((merchant) => {
      uniqueById.set(merchant.merchant_id, merchant)
    })

    return Array.from(uniqueById.values()).sort((a, b) => a.merchant_id - b.merchant_id)
  }, [merchants])

  const merchantName = useMemo(() => {
    if (!isSuperadmin) return currentUser?.merchant_name || "Merchant"
    const selected = merchantOptions.find((m) => m.merchant_id === selectedMerchantId)
    return selected?.name || "Merchant"
  }, [isSuperadmin, currentUser?.merchant_name, merchantOptions, selectedMerchantId])

  useEffect(() => {
    if (!errorMessage) return
    const timer = setTimeout(() => {
        setErrorMessage(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [errorMessage])


  async function loadRoles() {

    if (!currentUser || !canAccessManagement) return

    if (isSuperadmin && selectedMerchantId === undefined) {
      return
    }

    try {

      setLoading(true);

      const data = await fetchRoles(isSuperadmin ? selectedMerchantId : undefined);

      setRoles(data);

    } catch (error) {

      console.error("Error loading roles", error);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {
    if (!authLoading && currentUser && !canAccessManagement) {
      router.replace("/dashboard?denied=roles")
      return
    }

    if (!canAccessManagement) {
      return
    }

    if (!currentUser) return

    if (isSuperadmin) {
      return
    }

    setSelectedMerchantId(undefined)
  }, [authLoading, currentUser, isSuperadmin, canAccessManagement, router])

  useEffect(() => {
    if (!currentUser || !isSuperadmin || !canAccessManagement) return

    async function loadMerchants() {
      try {
        const data = await fetchMerchants()
        const mapped = data.map((merchant) => ({
            merchant_id: merchant.merchant_id,
            name: merchant.name,
          }))

        setMerchants(
          mapped
        )
        setSelectedMerchantId((current) => {
          if (current !== undefined) {
            return current
          }

          return mapped[0]?.merchant_id
        })
      } catch (error) {
        console.error("Error loading merchants", error)
      }
    }

    loadMerchants()
  }, [currentUser, isSuperadmin])

  useEffect(() => {
    if (!canAccessManagement) return
    loadRoles()
  }, [currentUser, isSuperadmin, selectedMerchantId, canAccessManagement]);

  if (!authLoading && currentUser && !canAccessManagement) {
    return null
  }

  async function handleCreateRole() {

    setErrorMessage(null)

    const cleanRoleName = sanitizeInput(newRole).replace(/\s+/g, " ")
    const roleError = validateRoleName(cleanRoleName)

    if (roleError) {
      setErrorMessage(roleError)
      return
    }

    try {

      const response = await createRole(cleanRoleName, isSuperadmin ? selectedMerchantId : undefined, newRoleIsAdmin);

      if (response.error) {
        setErrorMessage(response.error)
        return
      }

      setNewRole("");
      setNewRoleIsAdmin(false);

      loadRoles();

    } catch (error: any) {

      setErrorMessage(error?.message || "Error creando rol")

      console.error("Error creating role", error);

    }

  }

  async function handleSaveEdit(role_id: number) {

    setErrorMessage(null)

    const cleanRoleName = sanitizeInput(editingName).replace(/\s+/g, " ")
    const roleError = validateRoleName(cleanRoleName)

    if (roleError) {
      setErrorMessage(roleError)
      return
    }

    try {

      const response = await updateRole(role_id, cleanRoleName, isSuperadmin ? selectedMerchantId : undefined)

      if (response.error) {
        setErrorMessage(response.error)
        return
      }

      setEditingRoleId(null)
      setEditingName("")

      loadRoles()

    } catch (error: any) {

      setErrorMessage(error?.message || "Error actualizando rol")

    }

  }

  async function handleDeleteRole(role_id: number) {

    try {

        setErrorMessage(null)

        await deleteRole(role_id, isSuperadmin ? selectedMerchantId : undefined)

        loadRoles()

    } catch (error: any) {

      setErrorMessage(error?.message || "No se pudo eliminar el rol")

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

          <div className="flex flex-col gap-5 stagger-children">

            {/* Crear rol */}

            <GlassCard className="animate-fade-in">
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted-foreground tracking-wider">
                  Empresa
                </p>
                <h2 className="text-xl font-semibold text-foreground">{merchantName}</h2>
              </div>
            </GlassCard>

            <GlassCard className="animate-fade-in">

              <div className="flex flex-col gap-3">

                <div>

                  <p className="text-xs uppercase text-muted-foreground tracking-wider">
                    Crear Rol
                  </p>

                  <h2 className="text-lg font-semibold">
                    Nuevo Rol
                  </h2>

                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">

                  {isSuperadmin && (
                    <div className="min-w-[220px]">
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

                  <div className="flex-1 min-w-[240px]">
                    <input
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Nombre del rol..."
                      maxLength={50}
                      className="w-full rounded-xl border border-border/40 bg-background/70 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/80"
                    />
                  </div>

                  <label className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-background/65 px-4 py-2 text-sm whitespace-nowrap hover:border-primary/40 transition">
                    <input
                      type="checkbox"
                      checked={newRoleIsAdmin}
                      onChange={(e) => setNewRoleIsAdmin(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-foreground font-medium">¿Es Administrador?</span>
                  </label>

                  <button
                    onClick={handleCreateRole}
                    className="text-xs px-4 py-2 rounded-xl bg-primary/15 text-primary font-semibold hover:bg-primary/25 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.18)] transition"
                  >
                    Crear
                  </button>

                </div>

              </div>

            </GlassCard>

            {/* Tabla de roles */}

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
                      const canEditRole = !role.is_admin || isSuperadmin
                      const canDeleteRole = !role.is_admin || isSuperadmin

                        return (

                        <tr key={role.role_id}>

                            <td className="py-3">

                                {isEditing ? (

                                <input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                  maxLength={50}
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
                                      disabled={!canEditRole}
                                      title={!canEditRole ? "El rol administrador no puede modificarse" : ""}
                                        onClick={() => {
                                        setEditingRoleId(role.role_id)
                                        setEditingName(role.name)
                                        }}
                                        className={`text-xs px-3 py-1 border rounded-md 
                                      ${!canEditRole ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5"}`}
                                    >
                                        Editar
                                    </button>

                                    <button
                                      disabled={!canDeleteRole}
                                        onClick={() => setRoleToDelete(role)}
                                        className={`text-xs px-3 py-1 border rounded-md 
                                      ${!canDeleteRole ? "opacity-40 cursor-not-allowed" : "hover:bg-red-500/20 text-red-300 border-red-400/30"}`}
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

                  </div>

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