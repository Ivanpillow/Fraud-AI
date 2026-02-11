"use client";

import { Search, Settings, Bell } from "lucide-react";
import { useState } from "react";

export default function DashboardHeader({
  title,
  breadcrumb,
}: {
  title: string;
  breadcrumb?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Dashboard</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-foreground font-medium">
          {breadcrumb || title}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none w-[180px] focus:w-[240px] transition-all duration-300"
          />
        </div>

        {/* Actions */}
        <button
          className="glass-button flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          className="glass-button flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
