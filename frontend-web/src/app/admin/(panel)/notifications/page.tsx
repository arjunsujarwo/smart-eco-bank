"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { getNotifications, markNotificationRead, deleteNotification, deleteAllNotifications } from "@/lib/api";
import { useEcho } from "@/context/EchoContext";
import type { AppNotification } from "@/lib/types";
import { useTranslation } from "react-i18next";

const GROUPS: AppNotification["group"][] = ["Terbaru", "Kemarin", "Lebih Lama"];

const ICON_COLOR: Record<string, string> = {
  recycling: "bg-primary-container/20 text-primary",
  redeem: "bg-secondary-container/20 text-secondary",
  notifications: "bg-tertiary-container/20 text-tertiary",
};

export default function AdminNotificationsPage() {
  const { notifications: realtimeNotifs, markAllRead } = useEcho();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    getNotifications()
      .then((historical) => {
        const seen = seenIdsRef.current;
        const merged: AppNotification[] = [];
        for (const n of [...realtimeNotifs, ...historical]) {
          if (n.iconKey === "chat") continue;
          if (!seen.has(n.id)) { seen.add(n.id); merged.push(n); }
        }
        setItems(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inject newly arrived real-time notifs (non-chat) into local state
  useEffect(() => {
    const seen = seenIdsRef.current;
    const fresh = realtimeNotifs.filter((n) => n.iconKey !== "chat" && !seen.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seen.add(n.id));
    setItems((prev) => [...fresh, ...prev]);
  }, [realtimeNotifs]);

  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      await deleteAllNotifications();
      setItems([]);
      seenIdsRef.current.clear();
    } catch { /* silent */ }
    finally { setDeletingAll(false); }
  }

  async function handleMarkRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await markNotificationRead(id);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      seenIdsRef.current.delete(id);
    } catch { /* silent */ }
    finally { setDeleting(null); }
  }

  const unread = items.filter((n) => !n.read).length;
  const { t } = useTranslation();

  const GROUP_LABELS: Record<string, string> = {
    "Terbaru": t("notifications.groupRecent"),
    "Kemarin": t("notifications.groupYesterday"),
    "Lebih Lama": t("notifications.groupOlder"),
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("admin.notifications.title")}</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {t("admin.notifications.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
              {unread} {t("notifications.unread")}
            </span>
          )}
          {items.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-error/40 text-error rounded-xl text-xs font-bold hover:bg-error-container/30 transition-colors disabled:opacity-50"
            >
              {deletingAll
                ? <Icon name="sync" className="animate-spin" style={{ fontSize: 14 }} />
                : <Icon name="delete_sweep" style={{ fontSize: 14 }} />
              }
              {t("admin.notifications.delete")}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant gap-3">
          <Icon name="sync" className="animate-spin text-primary" style={{ fontSize: 24 }} />
          {t("admin.notifications.loading")}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant">
          <Icon name="notifications_off" style={{ fontSize: 48 }} className="opacity-30 mb-3" />
          <p>{t("admin.notifications.noNotifications")}</p>
        </div>
      ) : (
        GROUPS.map((group) => {
          const groupItems = items.filter((n) => n.group === group);
          if (!groupItems.length) return null;
          return (
            <section key={group} className="mb-8">
              <h2 className="text-xs font-bold text-outline uppercase tracking-wider mb-3 px-1">
                {GROUP_LABELS[group] ?? group}
              </h2>
              <div className="space-y-2">
                {groupItems.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      n.read
                        ? "bg-surface border-outline-variant"
                        : "bg-primary-container/5 border-primary/20 cursor-pointer hover:bg-primary-container/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ICON_COLOR[n.iconKey] ?? ICON_COLOR.notifications}`}>
                      <Icon name={n.iconKey} fill />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-on-surface text-sm leading-snug">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-xs text-outline mt-1">{n.timeAgo}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      disabled={deleting === n.id}
                      className="shrink-0 p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-40"
                      title={t("admin.notifications.delete")}
                    >
                      {deleting === n.id
                        ? <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />
                        : <Icon name="delete" style={{ fontSize: 16 }} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
