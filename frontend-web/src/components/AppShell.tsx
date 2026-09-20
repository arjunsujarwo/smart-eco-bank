"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import TopNavBar from "./TopNavBar";
import BottomNavBar from "./BottomNavBar";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";

/** Kerangka halaman terautentikasi: TopNav + konten + Footer + BottomNav mobile. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showChat = pathname !== "/customer-service";

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <TopNavBar />
      <main className="flex-grow w-full pb-24 md:pb-0">{children}</main>
      <Footer />
      <BottomNavBar />
      {showChat && <ChatWidget />}
    </div>
  );
}
