"use client";

import { useEffect, useState, useMemo } from "react";
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
import { sanitizeInput } from "@/lib/auth-validation";

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
    loadMerchants();
  }, []);

  async function handleEditMerchant(merchant: Merchant) {
    setEditingMerchantId(merchant.merchant_id);
    setEditingName(merchant.name);
    setEditingPlan(merchant.plan_type);
  }

  async function handleSaveEdit(merchant_id: number) {
    const cleanName = sanitizeInput(editingName).replace(/\s+/g, " ");
    if (!cleanName) return;

    try {
      await updateMerchant(merchant_id, {
        name: cleanName
      });

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
    setEditingMerchant(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowCreateModal(true);
  }

    function handleEdit(merchant: Merchant) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingMerchant(merchant);
    setShowCreateModal(true);
  }

  async function handleToggleStatus(merchant: Merchant) {
    const newStatus = merchant.status === "active" ? "inactive" : "active";
    try {
      await toggleMerchantStatus(merchant.merchant_id, newStatus);
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

  const statuses = useMemo(() => {
    const unique = new Set(merchants.map((m) => m.status));
    return ["all", ...Array.from(unique)];
  }, [merchants]);

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
          <>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statuses.map((s) => ({
                      value: s,
                      label: s === "all" ? "Todos los estados" : s,
                    }))}
                  />
                </div>
              </div>

              <button 
                onClick={handleCreate}
                className="text-xs px-4 py-2 rounded-lg bg-primary/15 text-primary font-medium hover:bg-primary/25 transition">
                Agregar Comercio
              </button>
            </div>

            {/* Tabla */}
            <GlassCard>
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">Comercios</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left py-3">Nombre</th>
                      <th className="text-left py-3">Estado</th>
                      <th className="text-left py-3">Label</th>
                      <th className="text-left py-3">Creado</th>
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
                                    className="w-24 text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                  >
                                    Editar
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus(merchant)}
                                    className="w-24 text-xs px-3 py-1 border rounded-md hover:bg-white/5"
                                  >
                                    {merchant.status === "active" ? "Desactivar" : "Activar"}
                                  </button>

                                  <button
                                    onClick={() => setMerchantToDelete(merchant)}
                                    className="w-24 text-xs px-3 py-1 border rounded-md text-red-400 hover:bg-red-500/10"
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
          </>
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