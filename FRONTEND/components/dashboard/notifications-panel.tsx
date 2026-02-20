"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  ShieldX,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Notification {
  id: string;
  type: "block" | "review";
  message: string;
  amount: number;
  timestamp: string;
  transaction_id: number;
  channel: string;
  fraud_probability: number;
}

function getIcon(type: Notification["type"]) {
  switch (type) {
    case "block":
      return <ShieldX size={16} />;
    case "review":
      return <AlertTriangle size={16} />;
    default:
      return <AlertTriangle size={16} />;
  }
}

function getIconColor(type: Notification["type"]) {
  switch (type) {
    case "block":
      return "text-destructive bg-destructive/10";
    case "review":
      return "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10";
    default:
      return "text-muted-foreground bg-white/[0.04]";
  }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        const res = await fetchNotifications();
        if (res.data) {
          const formattedNotifications = res.data.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            amount: n.amount,
            timestamp: n.timestamp,
            transaction_id: n.transaction_id,
            channel: n.channel,
            fraud_probability: n.fraud_probability,
          }));
          setNotifications(formattedNotifications);
        }
      }
      setIsLoading(false);
    }

    load();
  }, [user]);

  const handleNotificationClick = (notification: Notification) => {
    // Navega a la página de review con la transacción específica
    router.push(`/dashboard/review?transaction_id=${notification.transaction_id}&channel=${notification.channel}`);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl glass-button text-foreground lg:hidden"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="glass-sidebar w-full lg:w-[300px] xl:w-[320px] h-screen sticky top-0 flex flex-col border-l border-white/5 z-30">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Notificaciones
          </h2>
          {notifications.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close notifications"
        >
          <X size={18} />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2 stagger-children">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Sin alertas</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 rounded-xl p-3 text-left transition-all duration-200 w-full",
                  "hover:bg-white/[0.06] active:scale-[0.98]",
                  "bg-white/[0.02]"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    getIconColor(notif.type)
                  )}
                >
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-foreground font-medium">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(notif.timestamp)}
                    </span>
                    <span className="text-[10px] font-mono text-primary">
                      ${notif.amount.toLocaleString()}
                    </span>
                    {notif.type === "block" && (
                      <span className="text-[10px] text-destructive font-semibold">
                        BLOQUEADO
                      </span>
                    )}
                    {notif.type === "review" && (
                      <span className="text-[10px] text-[hsl(var(--warning))] font-semibold">
                        REVISAR
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="mt-1 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/5">
          <button 
            onClick={() => router.push("/dashboard/review")}
            className="flex items-center justify-center gap-1 w-full rounded-xl py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Ver todas las alertas
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
