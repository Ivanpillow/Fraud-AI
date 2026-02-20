"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFloatingButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleNavigate = () => {
    router.push("/");
  };

  return (
    <div className="fixed bottom-4 right-3 z-50">
      {isExpanded ? (
        <div className="glass-floating-expanded rounded-2xl p-4 animate-scale-in flex items-center gap-3 min-w-[220px]">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={handleNavigate}
            className="flex-1 flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Login as Admin
              </p>
              <p className="text-[10px] text-muted-foreground">
                Go to admin panel
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1"
            />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "glass-floating-button w-14 h-14 rounded-2xl",
            "flex items-center justify-center",
            "transition-all duration-300 hover:scale-105",
            "group"
          )}
          title="Login as Admin"
        >
          <Shield
            size={22}
            className="text-primary group-hover:scale-110 transition-transform"
          />
        </button>
      )}
    </div>
  );
}
