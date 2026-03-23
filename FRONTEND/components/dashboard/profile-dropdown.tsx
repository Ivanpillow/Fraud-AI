"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Shield, LayoutDashboard, LogOut, ChevronDown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";


export default function ProfileDropdown({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Para manejar el cierre del dropdown del perfil
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/checkout");
  };

  const handleAdminPanel = () => {
    setIsOpen(false);
    router.push("/dashboard");
  };

  const handlePaymentPage = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      {/* Botón del perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 p-5 border-b border-white/5",
          "hover:bg-white/[0.05]",
          "transition-colors duration-200",
          "group cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
            <Image
              src="/images/fraudai_icon_v2.png"
              alt="FraudAI"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>

          {/* <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Shield size={20} />
          </div> */}

          {!collapsed && (
            <div className="animate-fade-in overflow-hidden min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "admin@company.com"}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Menu desplegable */}
      {isOpen && !collapsed && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-white/10 rounded-lg shadow-lg z-40 overflow-hidden min-w-max">
          {/* Opción de administrador */}
          <button
            onClick={handleAdminPanel}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-white/[0.06]",
              "transition-colors duration-150",
              "border-b border-white/5"
            )}
          >
            <LayoutDashboard size={16} />
            <span>Panel de Administración</span>
          </button>

          {/* Payment Page Option */}
          <button
            onClick={handlePaymentPage}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
              "text-muted-foreground hover:text-emerald-400",
              "hover:bg-emerald-500/10",
              "transition-colors duration-150",
              "border-b border-white/5"
            )}
          >
            <CreditCard size={16} />
            <span>Pagos</span>
          </button>

          {/* Opción de cerrar sesión */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm",
              "text-muted-foreground hover:text-destructive",
              "hover:bg-destructive/10",
              "transition-colors duration-150"
            )}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
