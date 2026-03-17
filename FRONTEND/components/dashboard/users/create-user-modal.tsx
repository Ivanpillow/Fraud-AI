"use client"

import { useState, useEffect } from "react"
import { createUser, updateUser } from "@/lib/api"
import { fetchRoles } from "@/lib/api"
import CustomSelect from "@/components/checkout/custom-select"

type Props = {
  onClose: () => void
  onCreated: () => void
  user?: User | null
}

type User = {
  id: number
  email: string
  full_name: string
  role: string
}

type Role = {
  role_id: number
  name: string
  is_admin: boolean
}

type FormState = {
  email: string
  full_name: string
  password: string
  role: string
}

export default function CreateUserModal({ onClose, onCreated, user }: Props) {

  const [open, setOpen] = useState(false)

  const [roles, setRoles] = useState<Role[]>([])

  const [form, setForm] = useState<FormState>({
    email: "",
    full_name: "",
    password: "",
    role: ""
  })

  const editing = !!user

  useEffect(() => {

    setTimeout(() => setOpen(true), 10)

    async function loadRoles() {

      try {

        const data = await fetchRoles()

        setRoles(data)

        if (!editing && data.length > 0) {

          setForm(f => ({
            ...f,
            role: data[0].name
          }))

        }

      } catch (error) {

        console.error("Error loading roles", error)

      }

    }

    loadRoles()

  }, [])

  useEffect(() => {

    if (user) {

      setForm({
        email: user.email,
        full_name: user.full_name,
        password: "",
        role: user.role
      })

    }

  }, [user])

  function closeModal() {

    setOpen(false)

    setTimeout(() => onClose(), 200)

  }

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    try {

      if (editing && user) {

        await updateUser(user.id, {
          email: form.email,
          full_name: form.full_name,
          role: form.role
        })

      } else {

        await createUser({
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          role: form.role
        })

      }

      onCreated()
      closeModal()

    } catch (error) {

      console.error("Error saving user", error)

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

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-lg font-semibold">
            {editing ? "Editar Usuario" : "Crear Usuario"}
          </h2>

          <button
            onClick={closeModal}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>

        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          <input
            placeholder="Nombre completo"
            value={form.full_name}
            className="rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
            onChange={e =>
              setForm({ ...form, full_name: e.target.value })
            }
          />

          <input
            placeholder="Correo Electrónico"
            value={form.email}
            disabled={editing} 
            className={`rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary
                ${editing ? "opacity-50 cursor-not-allowed" : ""}`}
            onChange={e =>
                setForm({ ...form, email: e.target.value })
            }
          />

          {!editing && (

            <input
              placeholder="Contraseña"
              type="password"
              value={form.password}
              className="rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm outline-none focus:border-primary"
              onChange={e =>
                setForm({ ...form, password: e.target.value })
              }
            />

          )}

          <CustomSelect
            value={form.role}
            onChange={(value) =>
              setForm({ ...form, role: value })
            }
            options={roles.map((role) => ({
              value: role.name,
              label: role.name,
            }))}
          />

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
              {editing ? "Guardar Cambios" : "Crear Usuario"}
            </button>

          </div>

        </form>

      </div>

    </div>

  )

}