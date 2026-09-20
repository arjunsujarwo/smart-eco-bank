"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { getAdminChatSessions, getAdminChatMessages, sendAdminMessage } from "@/lib/adminApi";
import { useEcho } from "@/context/EchoContext";
import { useAuth } from "@/context/AuthContext";
import { mapEchoMessage } from "@/lib/echo";
import { playNotificationSound } from "@/lib/sounds";
import type { EchoMessagePayload } from "@/lib/echo";
import type { ChatMessage } from "@/lib/types";
import { useTranslation } from "react-i18next";
import type { AdminChatSession } from "@/lib/adminTypes";

export default function AdminChatPage() {
  const { user } = useAuth();
  const { echo } = useEcho();
  const [sessions, setSessions] = useState<AdminChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<AdminChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    getAdminChatSessions().then(setSessions);
  }, []);

  // Subscribe to current chat session
  useEffect(() => {
    if (!echo || !activeSession) return;
    const chatId = activeSession.id;
    echo
      .private(`chat.${chatId}`)
      .listen("MessageSent", (e: EchoMessagePayload) => {
        if (e.message.sender_id === Number(user?.id)) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === String(e.message.id))) return prev;
          return [...prev, mapEchoMessage(e.message)];
        });
        playNotificationSound("message");
        // update session last message in sidebar
        setSessions((prev) =>
          prev.map((s) =>
            s.id === chatId
              ? { ...s, lastMessage: e.message.message, unreadCount: 0 }
              : s,
          ),
        );
      });
    return () => {
      try { echo.leave(`chat.${chatId}`); } catch { }
    };
  }, [echo, activeSession?.id, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openSession(session: AdminChatSession) {
    setActiveSession(session);
    setMessages([]);
    setLoadingMsgs(true);
    setMobileView("chat");
    const msgs = await getAdminChatMessages(session.id);
    setMessages(msgs);
    setLoadingMsgs(false);
    // clear unread in sidebar
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, unreadCount: 0 } : s)),
    );
  }

  async function send() {
    if (!activeSession || !input.trim() || sending) return;
    const trimmed = input.trim();
    const adminMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      sender: "agent",
      senderName: user?.fullName ?? "Admin",
      text: trimmed,
      timeLabel: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((m) => [...m, adminMsg]);
    setInput("");
    setSending(true);
    try {
      await sendAdminMessage(activeSession.id, trimmed);
    } catch {
      // silent — message already shown optimistically
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Session list (left panel / mobile list view) ── */}
      <div
        className={`w-full md:w-80 md:flex flex-col border-r border-surface-variant bg-surface-container-low shrink-0 ${
          mobileView === "list" ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="p-4 border-b border-surface-variant">
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
            {t("admin.chat.title")}
          </h2>
          <p className="text-label-sm text-on-surface-variant mt-1">
            {`${sessions.length} ${t("admin.chat.activeSessions")}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              <Icon name="chat_bubble_outline" style={{ fontSize: 40 }} />
              <p className="mt-2 text-body-md">{t("admin.chat.noChats")}</p>
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s)}
                className={`w-full text-left flex items-start gap-3 p-4 border-b border-surface-variant transition-colors hover:bg-surface-container ${
                  activeSession?.id === s.id ? "bg-secondary-container/30" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0 font-bold">
                  {s.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-on-surface text-sm truncate">
                      {s.userName}
                    </span>
                    {s.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-on-primary rounded-full text-[10px] font-bold shrink-0">
                        {s.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-label-sm text-on-surface-variant truncate">
                    {s.lastMessage || t("admin.chat.startConversation")}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel (right panel / mobile chat view) ── */}
      <div
        className={`flex-1 flex flex-col w-full md:flex ${
          mobileView === "chat" ? "flex" : "hidden md:flex"
        }`}
      >
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4">
            <Icon name="forum" style={{ fontSize: 64 }} className="opacity-30" />
            <p className="text-body-lg">{t("admin.chat.selectSession")}</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-variant bg-surface shrink-0">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden p-1 rounded-full hover:bg-surface-variant"
              >
                <Icon name="arrow_back" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0">
                {activeSession.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-on-surface leading-tight">
                  {activeSession.userName}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  {activeSession.userEmail}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
              {loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <Icon name="sync" className="animate-spin text-primary" style={{ fontSize: 32 }} />
                </div>
              ) : (
                messages.map((m) => (
                  <AdminMessageBubble key={m.id} msg={m} isAdmin={m.sender === "agent"} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-surface-variant bg-surface shrink-0">
              <div className="flex items-end gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 focus-within:border-primary transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder={t("admin.chat.inputPlaceholder")}
                  className="flex-grow bg-transparent border-none focus:ring-0 resize-none text-sm text-on-surface placeholder:text-outline max-h-24 outline-none py-1"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="bg-primary text-on-primary p-2 rounded-lg hover:brightness-95 transition-all active:scale-90 disabled:opacity-40 shrink-0"
                >
                  {sending
                    ? <Icon name="sync" fill className="animate-spin" style={{ fontSize: 18 }} />
                    : <Icon name="send" fill style={{ fontSize: 18 }} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminMessageBubble({
  msg,
  isAdmin,
}: {
  msg: ChatMessage;
  isAdmin: boolean;
}) {
  return (
    <div className={`flex gap-2 max-w-[80%] ${isAdmin ? "self-end flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
          isAdmin
            ? "bg-secondary text-white"
            : "bg-primary-container text-on-primary-container"
        }`}
      >
        {isAdmin ? <Icon name="admin_panel_settings" fill style={{ fontSize: 16 }} /> : msg.senderName.charAt(0).toUpperCase()}
      </div>
      <div className={`flex flex-col gap-0.5 ${isAdmin ? "items-end" : ""}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isAdmin
              ? "bg-secondary text-white rounded-tr-sm"
              : "bg-surface border border-outline-variant text-on-surface rounded-tl-sm"
          }`}
        >
          {msg.text}
        </div>
        <span className={`text-[10px] text-outline px-1 ${isAdmin ? "text-right" : ""}`}>
          {msg.senderName} · {msg.timeLabel}
        </span>
      </div>
    </div>
  );
}
