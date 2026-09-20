"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { setupEcho, EchoInstance } from '@/lib/echo';
import { getStoredToken } from '@/lib/api';
import { playNotificationSound } from '@/lib/sounds';
import { useAuth } from './AuthContext';
import type { AppNotification } from '@/lib/types';

interface EchoContextValue {
  echo: EchoInstance | null;
  notifications: AppNotification[];
  unreadCount: number;
  chatUnreadCount: number;
  notifUnreadCount: number;
  markAllRead: () => void;
}

const EchoCtx = createContext<EchoContextValue>({
  echo: null,
  notifications: [],
  unreadCount: 0,
  chatUnreadCount: 0,
  notifUnreadCount: 0,
  markAllRead: () => {},
});

export function useEcho() {
  return useContext(EchoCtx);
}

let _id = 0;

const ICON_MAP: Record<string, string> = {
  transaction: 'recycling',
  reward: 'redeem',
  chat: 'chat',
};

function mapRawNotif(e: Record<string, unknown>): AppNotification {
  const n = (typeof e.notification === 'object' && e.notification !== null
    ? e.notification
    : e) as Record<string, unknown>;
  return {
    id: String(n.id ?? ++_id),
    iconKey: ICON_MAP[(n.reference_type as string) ?? ''] ?? 'notifications',
    title: String(n.title ?? 'Notifikasi Baru'),
    body: String(n.message ?? n.body ?? ''),
    timeAgo: 'Baru saja',
    group: 'Terbaru',
    read: false,
  };
}

export function EchoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [echo, setEcho] = useState<EchoInstance | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !user?.id) return;

    const instance = setupEcho(token);
    setEcho(instance);

    const onNotif = (e: Record<string, unknown>) => {
      const notif = mapRawNotif(e);
      if (typeof window !== "undefined") {
        if (notif.iconKey === "chat" && localStorage.getItem("eco_notif_chat") === "false") return;
        if ((notif.iconKey === "recycling" || notif.iconKey === "redeem") && localStorage.getItem("eco_notif_update") === "false") return;
      }

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      if (notif.iconKey === 'chat') {
        setChatUnreadCount((c) => c + 1);
      } else {
        setNotifUnreadCount((c) => c + 1);
      }
      if (typeof window !== "undefined") {
        if (localStorage.getItem("eco_notif_sound") !== "false") {
          playNotificationSound("notification");
        }
      }
    };

    instance.private(`App.Models.User.${user.id}`)
      .listen('AppNotificationSent', onNotif);

    if (user.role === 'admin') {
      instance.private('admin.notifications')
        .listen('AppNotificationSent', onNotif);
    }

    return () => {
      try {
        instance.leave(`App.Models.User.${user.id}`);
        if (user.role === 'admin') instance.leave('admin.notifications');
        instance.disconnect();
      } catch { }
      setEcho(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setChatUnreadCount(0);
    setNotifUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <EchoCtx.Provider value={{ echo, notifications, unreadCount, chatUnreadCount, notifUnreadCount, markAllRead }}>
      {children}
    </EchoCtx.Provider>
  );
}
