"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Users,
  Key,
  Store,
  icons
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileDropdown from "@/components/dashboard/profile-dropdown";


const navItems = [
  {
    label: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  // {
  //   label: "Charts",
  //   href: "/dashboard/charts",
  //   icon: BarChart3,
  // },
  {
    label: "Revisiones",
    href: "/dashboard/review",
    icon: ShieldAlert,
  },

  {
    label: "Administración",
    icon: PanelLeft,
    children: [
      {
        label: "Comercios",
        href: "/dashboard/merchants",
        icon: Store,
      },
      {
        label: "Gestión de Usuarios",
        href: "/dashboard/users",
        icon: Users,
      },
      {
        label: "Roles de la Empresa",
        href: "/dashboard/roles",
        icon: Key,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <aside
      className={cn(
        "glass-sidebar flex flex-col h-screen sticky top-0 z-30 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Menu desplegable de perfil */}
      <ProfileDropdown collapsed={collapsed} />

      <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href || "");

          // Si tiene children → dropdown
          if (item.children) {
            const isOpen = openMenu === item.label;

            return (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setOpenMenu(isOpen ? null : item.label)
                  }
                  className="flex items-center justify-between w-full gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed &&
                    (isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)}
                </button>

                {/* Submenu */}
                {isOpen && !collapsed && (
                  <div className="ml-6 mt-1 flex flex-col gap-1">
                    {item.children.map((sub) => {
                      const subActive = pathname.startsWith(sub.href);

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "text-sm px-3 py-2 rounded-lg transition",
                            subActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {sub.icon && <sub.icon size={16} className="shrink-0" />}
                            <span>{sub.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item normal
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-white/[0.06]",
                "active:scale-[0.97]",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 flex flex-col gap-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-200 w-full"
          aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
        >
          {collapsed ? (
            <ChevronRight size={20} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={20} className="shrink-0" />
              <span>Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
