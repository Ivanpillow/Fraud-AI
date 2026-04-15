"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, loginUser } from "@/lib/api";
import { isValidEmail, sanitizeInput, validatePassword } from "@/lib/auth-validation";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Validación de campos antes de enviar
  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const cleanEmail = sanitizeInput(email);

    if (!cleanEmail) {
      errors.email = "Correo electrónico es requerido";
    } else if (!isValidEmail(cleanEmail)) {
      errors.email = "Por favor ingrese un correo electrónico válido";
    }

    if (!password) {
      errors.password = "Contraseña es requerida";
    } else {
      const pwError = validatePassword(password);
      if (pwError) errors.password = pwError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejo del submit del formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateFields()) return;

    setIsLoading(true);

    try {
      const result = await loginUser(sanitizeInput(email), password);
      if (result.error) {
        if (result.status === 401) {
          setError("Credenciales inválidas. Intente nuevamente.");
        } else if (result.status === 403) {
          setError("Tu usuario está desactivado. Contacta a un administrador.");
        } else {
          setError(result.error || "Error desconocido. Por favor intente nuevamente.");
        }
      } else if (result.data?.userData) {
        const userData = result.data.userData;

        login({
          id: userData.id,
          email: userData.email,
          name: userData.full_name,
          role: userData.role,
          merchant_name: userData.merchant_name,
          is_admin: userData.is_admin,
          is_superadmin: userData.is_superadmin,
        });
      }
    } catch {
      setError("Error de red. Por favor intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {error && (
        <div className="animate-fade-in rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground/80"
        >
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Ingrese su correo electrónico"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          className={`glass-input w-full rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ${
            fieldErrors.email ? "border-destructive" : ""
          }`}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-xs text-destructive animate-fade-in">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground/80"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Ingrese su contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            className={`glass-input w-full rounded-lg px-4 py-3 pr-12 text-sm text-foreground outline-none ${
              fieldErrors.password ? "border-destructive" : ""
            }`}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password ? (
          <p id="password-error" className="text-xs text-destructive animate-fade-in">
            {fieldErrors.password}
          </p>
          ) : null}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="group relative mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.96),rgba(45,212,191,0.9),rgba(59,130,246,0.92))] py-3.5 px-4 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(8,145,178,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(8,145,178,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.24)_50%,transparent_70%)] translate-x-[-140%] transition-transform duration-1000 group-hover:translate-x-[140%]" />
        {isLoading ? (
          <span className="relative flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Iniciando sesión...
          </span>
        ) : (
          <span className="relative">Iniciar sesión</span>
        )}
      </button>
    </form>
  );
}
