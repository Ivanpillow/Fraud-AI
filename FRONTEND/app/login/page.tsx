"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/login/login-form";
import CheckoutFloatingButton from "@/components/checkout/checkout-floating-button";
import CommerceFloatingButton from "@/components/checkout/commerce-floating-button";
import { ArrowDown, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040814] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(45,212,191,0.24),transparent_26%),radial-gradient(circle_at_15%_82%,rgba(96,165,250,0.22),transparent_34%),linear-gradient(135deg,#02050b_0%,#050816_38%,#09192a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/25 blur-[120px]" />
      <div className="absolute right-[-5rem] top-16 h-96 w-96 rounded-full bg-emerald-400/30 blur-[150px]" />
      <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-sky-500/15 blur-[130px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 pt-6 md:px-10 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 overflow-hidden rounded-2xl border border-white/[0.15] bg-white/[0.08] p-2 shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <Image
                src="/images/fraudai_icon_v2.png"
                alt="FraudAI logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-none">
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/50">
                FraudAI
              </p>
              <p className="mt-1 text-sm font-semibold tracking-[0.22em] text-white/90">
                FraudAI
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-white/[0.55] backdrop-blur-xl md:flex">
            <Sparkles size={12} />
            Seguridad inteligente
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center px-4 py-10 md:px-8 lg:px-12">
          <div className="flex w-full max-w-4xl flex-col items-center text-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/[0.65] backdrop-blur-xl">
                <ShieldCheck size={14} className="text-emerald-300" />
                Monitoreo y prevención en tiempo real
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white text-balance md:text-6xl lg:text-7xl">
                  Bienvendido a FraudAI
                </h1>
                <p className="mx-auto max-w-2xl text-base leading-7 text-white/[0.72] md:text-lg">
                  Deteccion inteligente de fraude y monitoreo de transacciones en tiempo real.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogin((currentValue) => !currentValue)}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[linear-gradient(135deg,rgba(20,184,166,0.95),rgba(59,130,246,0.88))] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(8,145,178,0.32)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(8,145,178,0.42)] active:translate-y-0"
                  aria-expanded={showLogin}
                  aria-controls="login-panel"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.28)_50%,transparent_70%)] translate-x-[-140%] transition-transform duration-1000 group-hover:translate-x-[140%]" />
                  <span className="relative flex items-center gap-2">
                    Inicio de Sesion
                    <ArrowDown
                      size={16}
                      className={`transition-transform duration-300 ${showLogin ? "rotate-180" : "group-hover:translate-y-0.5"}`}
                    />
                  </span>
                </button>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/[0.48]">
                  Solamente para uso de administradores.
                </p>
              </div>
            </div>

            {showLogin && (
              <div
                id="login-panel"
                className="mt-10 w-full max-w-[480px] animate-scale-in"
              >
                <div className="rounded-[32px] border border-white/[0.12] bg-white/[0.08] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-[28px] md:p-8">
                  <div className="mb-6 text-left">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/[0.45]">
                      Acceso administrativo
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      Inicio de sesión
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/[0.65]">
                      Ingresa tus credenciales para acceder al panel de FraudAI.
                    </p>
                  </div>

                  <LoginForm />

                  <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-white/[0.45]">
                    Solamente para uso de administradores.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <CommerceFloatingButton />
      <CheckoutFloatingButton appearance="login" />
    </main>
  );
}
