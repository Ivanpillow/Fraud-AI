"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingButtonAppearance = "checkout" | "login";

type CheckoutFloatingButtonProps = {
  appearance?: FloatingButtonAppearance;
};

export default function CheckoutFloatingButton({
  appearance = "checkout",
}: CheckoutFloatingButtonProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const isLoginAppearance = appearance === "login";

  const handleNavigate = () => {
    router.push("/checkout");
  };

  return (
    <div className={cn("fixed z-50", isLoginAppearance ? "bottom-5 right-5" : "bottom-4 right-3") }>
      {isExpanded ? (
        <div
          className={cn(
            "animate-scale-in flex items-center gap-3",
            isLoginAppearance
              ? "glass-floating-expanded min-w-[198px] rounded-[24px] p-3.5 backdrop-blur-[30px]"
              : "glass-floating-expanded min-w-[220px] rounded-2xl p-4"
          )}
        >
          <button
            onClick={() => setIsExpanded(false)}
            className={cn(
              "flex items-center justify-center transition-all duration-200",
              isLoginAppearance
                ? "h-8 w-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14]"
                : "h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20"
            )}
          >
            <X size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={handleNavigate}
            className="flex-1 flex items-center gap-3 group"
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                isLoginAppearance ? "bg-cyan-400/12" : "bg-emerald-500/15"
              )}
            >
              <CreditCard size={16} className={isLoginAppearance ? "text-cyan-300" : "text-emerald-400"} />
            </div>
            <div className="text-left">
              <p className={cn(
                "text-sm font-semibold text-foreground transition-colors",
                isLoginAppearance ? "group-hover:text-cyan-300" : "group-hover:text-emerald-400"
              )}>
                Pagos
              </p>
              <p className="text-[10px] text-muted-foreground">
                Ir a checkout
              </p>
            </div>
            <ChevronRight
              size={16}
              className={cn(
                "text-muted-foreground transition-all group-hover:translate-x-1",
                isLoginAppearance ? "group-hover:text-cyan-300" : "group-hover:text-emerald-400"
              )}
            />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            isLoginAppearance
              ? "glass-floating-button h-12 w-12 rounded-full border border-white/[0.12] bg-white/[0.06] shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
              : "glass-floating-button w-14 h-14 rounded-2xl",
            "flex items-center justify-center",
            "transition-all duration-300 hover:scale-105",
            "group"
          )}
          title="Go to Payment Page"
        >
          <CreditCard
            size={isLoginAppearance ? 20 : 22}
            className={cn(
              "transition-transform group-hover:scale-110",
              isLoginAppearance ? "text-cyan-300" : "text-emerald-400"
            )}
          />
        </button>
      )}
    </div>
  );
}
