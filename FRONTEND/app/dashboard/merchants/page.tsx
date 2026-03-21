"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import CustomSelect from "@/components/checkout/custom-select";
import {
  fetchMerchants,
  updateMerchant,
  toggleMerchantStatus,
  deleteMerchant,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { sanitizeInput, validateMerchantName } from "@/lib/auth-validation";
import { useAuth } from "@/lib/auth-context";

import CreateMerchantModal from "@/components/dashboard/merchants/create_merchant_modal";

type APIKey = {
  api_key_id: number;
  key_hash: string;
  label: string | null;
  status: string;
  created_at: string;
};

type Merchant = {
  merchant_id: number;
  name: string;
  status: string;
  plan_type: string;
  created_at: string;
  api_keys: APIKey[];
};

export default function MerchantsPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const isSuperadmin = !!currentUser?.is_superadmin;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingMerchantId, setEditingMerchantId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPlan, setEditingPlan] = useState("basic");

  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function showSuperadminOnlyMessage(action: string) {
    setSuccessMessage(null);
    setErrorMessage(`Solo los superadmins pueden ${action} comercios.`);
  }

  async function loadMerchants() {
    try {
      setLoading(true);
      const data = await fetchMerchants();
      setMerchants(data);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error loading merchants", error);
      setErrorMessage("No se pudieron cargar los comercios. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && currentUser && !isSuperadmin) {
      router.replace("/dashboard?denied=merchants");
      return;
    }

    if (!currentUser || !isSuperadmin) {
      return;
    }

    loadMerchants();
  }, [authLoading, currentUser, isSuperadmin, router]);

  if (!authLoading && currentUser && !isSuperadmin) {
    return null;
  }

  async function handleEditMerchant(merchant: Merchant) {
    setEditingMerchantId(merchant.merchant_id);
    setEditingName(merchant.name);
    setEditingPlan(merchant.plan_type);
  }

  async function handleSaveEdit(merchant_id: number) {
    if (!isSuperadmin) {
      showSuperadminOnlyMessage("editar");
      return;
    }

    const cleanName = sanitizeInput(editingName).replace(/\s+/g, " ");
    const merchantNameError = validateMerchantName(cleanName);

    if (merchantNameError) {
      setSuccessMessage(null);
      setErrorMessage(merchantNameError);
      return;
    }

    try {
      const res = await updateMerchant(merchant_id, {
        name: cleanName
      });

      if (res.error) {
        setSuccessMessage(null);
        setErrorMessage(res.error);
        return;
      }

      setEditingMerchantId(null);
      setErrorMessage(null);
      setSuccessMessage("Comercio actualizado correctamente.");
      loadMerchants();
    } catch (error) {
      console.error("Error updating merchant", error);
      setErrorMessage("No se pudo actualizar el comercio.");
      setSuccessMessage(null);
    }
  }

  function handleCreate() {
    if (!isSuperadmin) {
      showSuperadminOnlyMessage("agregar");
      return;
    }

    setEditingMerchant(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowCreateModal(true);
  }

    function handleEdit(merchant: Merchant) {
    if (!isSuperadmin) {
      showSuperadminOnlyMessage("editar");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingMerchant(merchant);
    setShowCreateModal(true);
  }

  async function handleToggleStatus(merchant: Merchant) {
    if (!isSuperadmin) {
      showSuperadminOnlyMessage("cambiar el estado de");
      return;
    }

    const newStatus = merchant.status === "active" ? "inactive" : "active";
    try {
      const res = await toggleMerchantStatus(merchant.merchant_id, newStatus);

      if (res.error) {
        setSuccessMessage(null);
        setErrorMessage(res.error);
        return;
      }

      setErrorMessage(null);
      setSuccessMessage(
        newStatus === "active"
          ? "Comercio activado correctamente."
          : "Comercio desactivado correctamente."
      );
      loadMerchants();
    } catch (error) {
      console.error("Error toggling merchant status", error);
      setSuccessMessage(null);
      setErrorMessage("No se pudo cambiar el estado del comercio.");
    }
  }

  async function handleDeleteMerchant(merchant_id: number) {
    if (!isSuperadmin) {
      showSuperadminOnlyMessage("eliminar");
      return;
    }

    try {
      await deleteMerchant(merchant_id);
      setMerchantToDelete(null);
      setErrorMessage(null);
      setSuccessMessage("Comercio eliminado correctamente.");
      loadMerchants();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo eliminar el comercio.";
      setSuccessMessage(null);
      setErrorMessage(message);
      setMerchantToDelete(null);
    }
  }

  const plans = useMemo(() => {
    const unique = new Set(merchants.map((m) => m.plan_type));
    return ["all", ...Array.from(unique)];
  }, [merchants]);

  const statuses = useMemo(
    () => [
      { value: "all", label: "Todos los estados" },
      { value: "active", label: "Activos" },
      { value: "inactive", label: "Inactivos" },
    ],
    []
  );

  const filteredMerchants = useMemo(() => {
    return merchants.filter((merchant) => {
      const matchesSearch = merchant.name.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || merchant.plan_type === planFilter;
      const matchesStatus = statusFilter === "all" || merchant.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [merchants, search, planFilter, statusFilter]);

  const activeCount = merchants.filter((m) => m.status === "active").length;
  const inactiveCount = merchants.length - activeCount;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Gestión de Comercios" breadcrumb="Gestión de Comercios" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 stagger-children">
            {!isSuperadmin && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Solo los superadmins pueden administrar los comercios.
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {successMessage}
              </div>
            )}

            {/* Empresa */}
            <GlassCard>
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase text-muted-foreground tracking-wider">
                  Sistema
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  Comercios Registrados
                </h2>
              </div>
            </GlassCard>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Comercios
                  </p>
                  <p className="text-2xl font-bold">{merchants.length}</p>
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
                    placeholder="Buscar comercio..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-sm"
                  />
                </div>

                <div className="min-w-[180px]">
                  <CustomSelect
                    variant="dashboard"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statuses}
                  />
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={!isSuperadmin}
                title={!isSuperadmin ? "Solo los superadmins pueden agregar comercios" : ""}
                className={cn(
                  "text-xs px-4 py-2 rounded-lg bg-primary/15 text-primary font-medium transition",
                  isSuperadmin ? "hover:bg-primary/25" : "opacity-40 cursor-not-allowed"
                )}>
                Agregar Comercio
              </button>
            </div>

            {/* Tabla */}
            <GlassCard className="animate-fade-in">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">Comercios</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left py-3">Nombre</th>
                      <th className="text-left py-3">Estado</th>
                      <th className="text-left py-3">Etiqueta</th>
                      <th className="text-left py-3">Fecha de Creación</th>
                      <th className="py-3 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/40">
                    {filteredMerchants.map((merchant) => {
                      const isEditing = editingMerchantId === merchant.merchant_id;
                      const apiKey = merchant.api_keys[0];

                      return (
                        <tr key={merchant.merchant_id}>
                          <td className="py-3 font-medium">
                            {isEditing ? (
                              <input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="glass rounded-md px-2 py-1 text-sm"
                              />
                            ) : (
                              merchant.name
                            )}
                          </td>

                          

                          <td className="py-3">
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded-md font-medium",
                                merchant.status === "active"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              )}
                            >
                              {merchant.status}
                            </span>
                          </td>

                          <td className="py-3 text-muted-foreground font-mono text-xs">
                            {apiKey?.label || "-"}
                          </td>

                          <td className="py-3 text-muted-foreground text-xs">
                            {new Date(merchant.created_at).toLocaleDateString()}
                          </td>

                          <td className="py-3">
                            <div className="flex items-center justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(merchant.merchant_id)}
                                    className="w-24 text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingMerchantId(null)}
                                    className="w-24 text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(merchant)}
                                    disabled={!isSuperadmin}
                                    title={!isSuperadmin ? "Solo los superadmins pueden editar comercios" : ""}
                                    className={cn(
                                      "w-24 text-xs px-3 py-1 border rounded-md",
                                      isSuperadmin ? "hover:bg-white/5" : "opacity-40 cursor-not-allowed"
                                    )}
                                  >
                                    Editar
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(merchant)}
                                    disabled={!isSuperadmin}
                                    title={!isSuperadmin ? "Solo los superadmins pueden cambiar estado de comercios" : ""}
                                    className={cn(
                                      "w-24 text-xs px-3 py-1 border rounded-md",
                                      isSuperadmin ? "hover:bg-white/5" : "opacity-40 cursor-not-allowed"
                                    )}
                                  >
                                    {merchant.status === "active" ? "Desactivar" : "Activar"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (!isSuperadmin) {
                                        showSuperadminOnlyMessage("eliminar");
                                        return;
                                      }
                                      setMerchantToDelete(merchant);
                                    }}
                                    disabled={!isSuperadmin}
                                    title={!isSuperadmin ? "Solo los superadmins pueden eliminar comercios" : ""}
                                    className={cn(
                                      "w-24 text-xs px-3 py-1 border rounded-md text-red-400",
                                      isSuperadmin ? "hover:bg-red-500/10" : "opacity-40 cursor-not-allowed"
                                    )}
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Modal eliminar */}
      {merchantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl p-6 w-[420px] border border-border/40">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Seguro que deseas eliminar el comercio
              <span className="font-semibold text-white"> {merchantToDelete.name}</span>?
            </p>

            <div className="mb-6 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Solo se puede eliminar si el comercio esta inactivo y no tiene usuarios activos ni usuarios asignados.
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMerchantToDelete(null)}
                className="text-xs px-4 py-2 border rounded-md hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={() => handleDeleteMerchant(merchantToDelete.merchant_id)}
                className="text-xs px-4 py-2 rounded-md border border-red-400/30 text-red-300 hover:bg-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateMerchantModal
            merchant={editingMerchant}
            onClose={() => {
            setShowCreateModal(false);
            setEditingMerchant(null);
            }}
            onCreated={() => {
            loadMerchants();
            setEditingMerchant(null);
              setShowCreateModal(false);
              setErrorMessage(null);
              setSuccessMessage("Comercio guardado correctamente.");
            }}
        />
        )}
    </div>
  );
}