"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommerceFloatingButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavigate = () => {
    router.push("/demo-ecommerce");
  };

  return (
    <div className="fixed bottom-20 right-5 z-50 md:bottom-20 md:right-5">
      {isExpanded ? (
        <div className="glass-floating-expanded animate-scale-in flex min-w-[218px] items-center gap-3 rounded-[24px] p-3.5 backdrop-blur-[30px]">
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] transition-all duration-200 hover:bg-white/[0.14]"
            aria-label="Cerrar acceso a shop simulator"
          >
            <X size={14} className="text-muted-foreground" />
          </button>

          <button onClick={handleNavigate} className="group flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/12">
              <Store size={16} className="text-amber-300" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-amber-300">
                Ir a Shop Simulator
              </p>
              <p className="text-[10px] text-muted-foreground">Demo ecommerce conectada</p>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-amber-300"
            />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "glass-floating-button h-12 w-12 rounded-full border border-white/[0.12] bg-white/[0.06] shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
            "group flex items-center justify-center transition-all duration-300 hover:scale-105"
          )}
          title="Ir a Shop Simulator"
          aria-label="Ir a Shop Simulator"
        >
          <BookOpen size={20} className="text-amber-300 transition-transform group-hover:scale-110" />
        </button>
      )}
    </div>
  );
}