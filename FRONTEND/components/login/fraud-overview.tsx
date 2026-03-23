"use client";

import Image from "next/image";
import { Activity, Brain, AlertTriangle, Camera } from "lucide-react";

export default function FraudOverview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_14%_16%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_88%_20%,rgba(56,189,248,0.14),transparent_42%),linear-gradient(145deg,#050913,#0a1424_48%,#0a1f26)] p-8 md:p-10 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="max-w-md">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75">
           Confianza y Seguridad
          </span>

          <h2 className="mt-5 text-5xl md:text-6xl font-black leading-[0.95] tracking-[-0.02em] font-mono text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            FraudAI
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Deteccion inteligente de fraude y monitoreo de transacciones en tiempo real.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px]">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <Activity size={16} className="text-primary" />
              <span className="text-white/90">Monitoreo en tiempo real</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <Brain size={16} className="text-primary" />
              <span className="text-white/90">Analisis con inteligencia artificial</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <AlertTriangle size={16} className="text-primary" />
              <span className="text-white/90">Alertas de riesgo</span>
            </div>
          </div>

          <div className="relative hidden overflow-hidden rounded-xl border border-white/12 bg-white/5 lg:block">
            <Image
              src="/images/main_imagen_fraudai_hd.png"
              alt="Vista de monitoreo FraudAI"
              fill
              className="object-cover object-center opacity-55 grayscale-[0.15]"
              sizes="180px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
            {/* <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-2 py-1.5 backdrop-blur-sm">
              <Camera size={14} className="text-primary" />
              <span className="text-[11px] text-white/85">Vista de riesgo</span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}