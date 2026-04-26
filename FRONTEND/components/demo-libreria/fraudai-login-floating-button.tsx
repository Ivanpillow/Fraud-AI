"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Shield, X } from "lucide-react";

export default function FraudAiLoginFloatingButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isExpanded ? (
        <div className="glass-floating-expanded animate-scale-in flex min-w-[230px] items-center gap-3 rounded-[24px] p-3.5 backdrop-blur-[30px]">
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] transition-all duration-200 hover:bg-white/[0.14]"
            aria-label="Cerrar"
          >
            <X size={14} className="text-muted-foreground" />
          </button>

          <button onClick={goToLogin} className="group flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/12">
              <Shield size={16} className="text-cyan-300" />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-cyan-300">
                Ir a FraudAI
              </p>
              <p className="text-[10px] text-muted-foreground">Login administrador</p>
            </div>

            <ChevronRight
              size={16}
              className="text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-cyan-300"
            />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="glass-floating-button flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition-all duration-300 hover:scale-105"
          title="Ir a FraudAI Login"
          aria-label="Ir a FraudAI Login"
        >
          <Shield size={20} className="text-cyan-300" />
        </button>
      )}
    </div>
  );
}
