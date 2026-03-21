"use client"

import { useState, useEffect } from "react"
import { createMerchant, updateMerchant } from "@/lib/api"
import CustomSelect from "@/components/checkout/custom-select"
import { sanitizeInput, validateMerchantName } from "@/lib/auth-validation"

type Props = {
  onClose: () => void
  onCreated: () => void
  merchant?: Merchant | null
}

type Merchant = {
  merchant_id: number
  name: string
  status: string
  plan_type: string
  api_keys: {
    label: string | null
  }[]
}

type FormState = {
  name: string
  status: string
  key: string
}

export default function CreateMerchantModal({ onClose, onCreated, merchant }: Props) {

  const [open, setOpen] = useState(false)

  const [form, setForm] = useState<FormState>({
    name: "",
    status: "active",
    key: ""
  })

  const [error, setError] = useState<string | null>(null)

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    status?: string
    key?: string
  }>({})

  const editing = !!merchant

  useEffect(() => {
    setTimeout(() => setOpen(true), 10)
  }, [])

  useEffect(() => {
    if (merchant) {
      setForm({
        name: merchant.name,
        status: merchant.status || "active",
        key: merchant.api_keys?.[0]?.label || ""
      })
    }
  }, [merchant])

  function closeModal() {
    setOpen(false)
    setTimeout(() => onClose(), 200)
  }

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault()
    setError(null)

    const errors: {
      name?: string
      status?: string
      key?: string
    } = {}

    const cleanName = sanitizeInput(form.name).replace(/\s+/g, " ")
    const cleanKey = sanitizeInput(form.key).replace(/\s+/g, "")

    const merchantNameError = validateMerchantName(cleanName)
    if (merchantNameError) {
      errors.name = merchantNameError
    }

    if (!editing) {
      if (!cleanKey) {
        errors.key = "La llave es requerida"
      } else if (/\s/.test(cleanKey)) {
        errors.key = "La llave no puede contener espacios"
      } else if (cleanKey.length < 6) {
        errors.key = "La llave debe tener al menos 6 caracteres"
      } else if (cleanKey.length > 120) {
        errors.key = "La llave es demasiado larga"
      }
    } else if (cleanKey) {
      if (/\s/.test(cleanKey)) {
        errors.key = "La llave no puede contener espacios"
      } else if (cleanKey.length < 6) {
        errors.key = "La llave debe tener al menos 6 caracteres"
      } else if (cleanKey.length > 120) {
        errors.key = "La llave es demasiado larga"
      }
    }

    if (!editing && !["active", "inactive"].includes(form.status)) {
      errors.status = "Estatus inválido"
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {

      if (editing && merchant) {

        const payload: {
          name: string
          label?: string
        } = {
          name: cleanName
        }

        if (cleanKey && cleanKey !== merchant.api_keys?.[0]?.label) {
          payload.label = cleanKey
        }

        const res = await updateMerchant(merchant.merchant_id, payload)

        if (res?.error) {
          setError(res.error)
          return
        }

      } else {

        const res = await createMerchant({
          name: cleanName,
          status: form.status,
          plan_type: "basic",
          key: cleanKey
        })

        if (res?.error) {
          setError(res.error)
          return
        }

      }

      onCreated()
      closeModal()

    } catch (err) {
      setError("Error al guardar comercio. Intente nuevamente.")
      console.error("Error saving merchant", err)
    }
  }

  return (

    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200
      ${open ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"}`}
    >

      <div
        className={`w-[420px] rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-xl
        p-6 transform transition-all duration-200
        ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold">
            {editing ? "Editar Comercio" : "Crear Comercio"}
          </h2>

          <button
            onClick={closeModal}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>

        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Nombre */}
          <input
            placeholder="Nombre del comercio"
            value={form.name}
            className={`rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary ${
              fieldErrors.name ? "border-destructive" : ""
            }`}
            onChange={e =>
              setForm({ ...form, name: e.target.value })
            }
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}

          {/* Llave */}
          <input
            placeholder="Llave (sin espacios)"
            value={form.key}
            className={`rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary ${
              fieldErrors.key ? "border-destructive" : ""
            }`}
            onChange={e => {
              const value = e.target.value.replace(/\s/g, "") // 🔥 elimina espacios en tiempo real
              setForm({ ...form, key: value })
            }}
          />
          {fieldErrors.key && (
            <p className="text-xs text-destructive">{fieldErrors.key}</p>
          )}

          {/* Estado */}
          {!editing && (
            <>
              <CustomSelect
                value={form.status}
                onChange={(value) =>
                  setForm({ ...form, status: value })
                }
                options={[
                  { value: "active", label: "Activo" },
                  { value: "inactive", label: "Inactivo" }
                ]}
              />
              {fieldErrors.status && (
                <p className="text-xs text-destructive">{fieldErrors.status}</p>
              )}
            </>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2 mt-4">

            <button
              type="button"
              onClick={closeModal}
              className="text-xs px-4 py-2 rounded-md border border-border hover:bg-white/5 transition"
            >
              Cancelar
            </button>

            <button
              className="text-xs px-4 py-2 rounded-md bg-primary text-white hover:opacity-90 transition"
            >
              {editing ? "Guardar Cambios" : "Crear Comercio"}
            </button>

          </div>

        </form>

      </div>

    </div>

  )

}