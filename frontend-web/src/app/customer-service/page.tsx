"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { sendSupportMessage, getChatHistory, initialSupportMessages } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useEcho } from "@/context/EchoContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import { mapEchoMessage } from "@/lib/echo";
import { playNotificationSound } from "@/lib/sounds";
import type { EchoMessagePayload } from "@/lib/echo";
import type { ChatMessage } from "@/lib/types";
import { useTranslation } from "react-i18next";

export default function CustomerServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const QUICK_REPLIES = [
    t("customerService.quickReplies.0"),
    t("customerService.quickReplies.1"),
    t("customerService.quickReplies.2"),
  ];
  const { echo } = useEcho();
  const { toast, showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatHistory()
      .then(({ messages: msgs, chatId: id }) => {
        setMessages(msgs);
        if (id) setChatId(id);
      })
      .catch(() => setMessages(initialSupportMessages()));
  }, []);

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
      });
    return () => {
      try { echo.leave(`chat.${chatId}`); } catch { }
    };
  }, [echo, chatId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal mengirim pesan", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      {toast && <Toast {...toast} />}
      <div className="max-w-[1000px] mx-auto w-full flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-180px)] my-stack-lg px-container-padding-mobile md:px-0">
        {/* Header */}
        <div className="px-stack-md pt-stack-md pb-4">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
            {t("customerService.title")}
          </h1>
        </div>
        <div className="h-20 border-b border-outline-variant/30 flex items-center justify-between px-stack-md glass-panel rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container border-2 border-primary-container">
                <Icon name="support_agent" fill />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary-container border-2 border-surface-bright rounded-full" />
            </div>
            <div>
              <h3 className="font-headline-md text-body-lg font-bold leading-tight">
                Admin Smart Eco Bank
              </h3>
              <p className="text-sm text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            title="Minimize"
            className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
          >
            <Icon name="close_fullscreen" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-stack-md flex flex-col gap-stack-md bg-surface-bright custom-scrollbar">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-stack-md border-t border-outline-variant/30 bg-white rounded-b-xl">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="whitespace-nowrap px-4 py-2 bg-surface-container-low hover:bg-primary-container/20 border border-outline-variant rounded-full text-sm font-medium text-on-surface-variant transition-all active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="relative flex items-end gap-2 bg-surface-container-low border border-outline-variant p-2 rounded-2xl focus-within:border-primary transition-all">
            <button className="p-2 text-outline hover:text-primary transition-colors">
              <Icon name="add_circle" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={t("customerService.inputPlaceholder")}
              className="flex-grow bg-transparent border-none focus:ring-0 resize-none py-2 font-body-md text-on-surface placeholder:text-outline max-h-32 outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || sending}
              className="bg-primary text-on-primary p-2.5 rounded-xl hover:brightness-95 transition-all flex items-center justify-center active:scale-90 disabled:opacity-40"
            >
              {sending
                ? <Icon name="sync" fill className="animate-spin text-base" />
                : <Icon name="send" fill />}
            </button>
          </div>
          <p className="text-[10px] text-outline mt-2 px-1">
            Smart Eco Bank menggunakan enkripsi end-to-end.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === "user";
  return (
    <div className={`flex gap-3 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : ""}`}>
      <Avatar sender={msg.sender} />
      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : ""}`}>
        <div
          className={
            isUser
              ? "bg-primary text-on-primary p-4 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-sm"
              : "bg-surface-container-low border border-outline-variant p-4 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
          }
        >
          <p className="font-body-md whitespace-pre-wrap">
            <span className={isUser ? "text-on-primary" : "text-on-surface-variant"}>{msg.text}</span>
          </p>
        </div>
        <span className={`text-[10px] text-outline ${isUser ? "mr-1" : "ml-1"}`}>
          {msg.senderName} · {msg.timeLabel}
        </span>
      </div>
    </div>
  );
}

function Avatar({ sender }: { sender: ChatMessage["sender"] }) {
  if (sender === "user")
    return (
      <div className="w-8 h-8 rounded-full shrink-0 bg-secondary-container flex items-center justify-center text-on-secondary-container">
        <Icon name="person" />
      </div>
    );
  if (sender === "bot")
    return (
      <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shrink-0 text-on-primary-container">
        <Icon name="auto_awesome" fill className="text-xl" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full shrink-0 bg-secondary flex items-center justify-center text-white">
      <Icon name="support_agent" fill className="text-lg" />
    </div>
  );
}
