"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./ui/Icon";
import { sendSupportMessage, getChatHistory, initialSupportMessages } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useEcho } from "@/context/EchoContext";
import { mapEchoMessage } from "@/lib/echo";
import { playNotificationSound } from "@/lib/sounds";
import type { EchoMessagePayload } from "@/lib/echo";
import type { ChatMessage } from "@/lib/types";

export default function ChatWidget() {
  const router = useRouter();
  const { user } = useAuth();
  const { echo } = useEcho();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (open && messages.length === 0) {
      getChatHistory()
        .then(({ messages: msgs, chatId: id }) => {
          setMessages(msgs);
          if (id) setChatId(id);
        })
        .catch(() => setMessages(initialSupportMessages()));
    }
  }, [open, messages.length]);

  // Subscribe to chat channel when echo + chatId available
  useEffect(() => {
    if (!echo || !chatId) return;
    echo
      .private(`chat.${chatId}`)
      .listen("MessageSent", (e: EchoMessagePayload) => {
        if (e.message.sender_id === Number(user?.id)) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === String(e.message.id))) return prev;
          return [...prev, mapEchoMessage(e.message)];
        });
        playNotificationSound("message");
        if (!openRef.current) setUnreadCount((c) => c + 1);
      });
    return () => {
      try { echo.leave(`chat.${chatId}`); } catch { }
    };
  }, [echo, chatId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      senderName: user?.fullName ?? "Anda",
      text: trimmed,
      timeLabel: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { chatId: newId } = await sendSupportMessage(trimmed);
      if (newId && !chatId) setChatId(newId);
    } catch {
      // silent — user can retry
    } finally {
      setSending(false);
    }
  }

  function expandToFullPage() {
    setOpen(false);
    router.push("/customer-service");
  }

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3">
      {/* ── Mini chat window ── */}
      {open && (
        <div
          className="w-[calc(100vw-2rem)] max-w-sm md:w-96 bg-surface rounded-2xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Window header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-on-primary shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Icon name="support_agent" fill className="text-lg" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary-container rounded-full border-2 border-primary" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-sm leading-snug">Admin Smart Eco Bank</p>
              <p className="text-[11px] opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary-fixed rounded-full animate-pulse shrink-0" />
                Online
              </p>
            </div>
            <button
              onClick={expandToFullPage}
              title="Buka halaman penuh"
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Icon name="open_in_full" className="text-base" />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Tutup"
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Icon name="close" className="text-base" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-3 flex flex-col gap-3 bg-surface-container-lowest">
            {messages.map((m) => (
              <MiniMessage key={m.id} msg={m} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-outline-variant bg-surface shrink-0">
            <div className="flex items-end gap-2 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 focus-within:border-primary transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Tulis pesan..."
                className="flex-grow bg-transparent border-none focus:ring-0 resize-none text-sm text-on-surface placeholder:text-outline max-h-20 outline-none py-0.5"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || sending}
                className="bg-primary text-on-primary p-1.5 rounded-lg hover:brightness-95 transition-all active:scale-90 disabled:opacity-40 shrink-0"
              >
                {sending
                  ? <Icon name="sync" fill className="animate-spin" style={{ fontSize: 18 }} />
                  : <Icon name="send" fill style={{ fontSize: 18 }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Tutup chat" : "Hubungi Admin"}
        className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center relative"
      >
        <Icon
          name={open ? "close" : "chat"}
          fill
          className="text-2xl transition-transform"
        />
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-error text-on-error rounded-full border-2 border-surface text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

function MiniMessage({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex gap-2 max-w-[90%] ${isUser ? "self-end flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${isUser ? "bg-secondary-container text-on-secondary-container" : "bg-secondary text-white"}`}
      >
        <Icon
          name={isUser ? "person" : "support_agent"}
          fill
          className="text-xs"
          style={{ fontSize: 14 }}
        />
      </div>
      <div className={`flex flex-col gap-0.5 ${isUser ? "items-end" : ""}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-on-primary rounded-tr-sm"
              : "bg-surface border border-outline-variant text-on-surface rounded-tl-sm"
          }`}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-outline px-1">
          {msg.senderName} · {msg.timeLabel}
        </span>
      </div>
    </div>
  );
}
