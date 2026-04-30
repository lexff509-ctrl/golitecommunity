"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

const TYPE_MAP: Record<string, { icon: string; color: string }> = {
  info: { icon: "ℹ️", color: "bg-blue-50 border-blue-200" },
  success: { icon: "✅", color: "bg-green-50 border-green-200" },
  warning: { icon: "⚠️", color: "bg-amber-50 border-amber-200" },
  error: { icon: "❌", color: "bg-red-50 border-red-200" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, []);

  const handleMarkAllRead = async () => {
    await apiFetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    fetchNotifications();
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      });
    }
    if (notif.link) {
      window.location.assign(notif.link);
    }
    fetchNotifications();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            🔔 Notifications
          </h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes les notifications sont lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {notifications.map((n) => {
            const t = TYPE_MAP[n.type] || TYPE_MAP.info;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                  n.read
                    ? "bg-white border-slate-200"
                    : `${t.color} border-current`
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}
                      >
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
