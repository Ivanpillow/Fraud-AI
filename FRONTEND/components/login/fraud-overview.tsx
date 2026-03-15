"use client";

import Image from "next/image";
import { Activity, Brain, AlertTriangle, Camera } from "lucide-react";

export default function FraudOverview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">

      {/* Imagen de fondo */}
      <Image
        src="/images/banner_login.png"
        alt="Fraud monitoring"
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Gradiente oscuro */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Contenido */}
      <div className="absolute inset-0 flex items-end p-8 md:p-10 text-white">

        <div className="max-w-sm space-y-6">

          {/* Título */}
          <h2 className="text-4xl font-bold leading-tight">
            FraudAI
          </h2>

          {/* Subtítulo */}
          <p className="text-sm text-white/80 leading-relaxed">
            Detección inteligente de fraude y monitoreo de transacciones en tiempo real.
          </p>

          {/* Bullets */}
          <div className="space-y-3 text-sm">

            <div className="flex items-center gap-3">
              <Activity size={16} className="text-primary" />
              <span className="text-white/90">Monitoreo en tiempo real</span>
            </div>

            <div className="flex items-center gap-3">
              <Brain size={16} className="text-primary" />
              <span className="text-white/90">Análisis con inteligencia artificial</span>
            </div>

            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-primary" />
              <span className="text-white/90">Alertas de riesgo</span>
            </div>

            <div className="flex items-center gap-3">
              <Camera size={16} className="text-primary" />
              <span className="text-white/90">Imagen provisional no te me paniquees</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}