"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./ui/Icon";
import { useEcho } from "@/context/EchoContext";
import { useTranslation } from "react-i18next";

const NAV_KEYS = [
  { href: "/dashboard", key: "nav.home" },
  { href: "/locations", key: "nav.locations" },
  { href: "/scanner", key: "nav.deposit" },
  { href: "/history", key: "nav.transactions" },
  { href: "/rewards", key: "nav.rewards" },
  { href: "/settings", key: "nav.settings" },
];

export default function TopNavBar() {
  const pathname = usePathname();
  const { unreadCount } = useEcho();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-surface-variant">
      <div className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-headline-md font-headline-md font-bold text-primary"
          >
            <img src="/logo.svg" alt="Smart Eco Bank" className="w-8 h-8 rounded-lg object-cover" />
            Smart Eco Bank
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_KEYS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "text-body-md font-body-md text-primary border-b-2 border-primary pb-1"
                      : "text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors"
                  }
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/notifications"
            className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors relative"
            aria-label="Notifikasi"
          >
            <Icon name="notifications" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error border border-surface" />
            )}
          </Link>
          <Link
            href="/settings"
            className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-surface-variant text-on-primary-container"
            aria-label="Profil"
          >
            <Icon name="person" fill />
          </Link>
        </div>
      </div>
    </header>
  );
}
