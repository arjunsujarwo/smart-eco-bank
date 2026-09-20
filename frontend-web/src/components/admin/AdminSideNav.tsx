"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useEcho } from "@/context/EchoContext";
import { useTranslation } from "react-i18next";

export default function AdminSideNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { chatUnreadCount, notifUnreadCount } = useEcho();

  const NAV_ITEMS = [
    { href: "/admin/verification", label: t("admin.nav.verification"), icon: "verified_user" },
    { href: "/admin/rewards", label: t("admin.nav.rewards"), icon: "redeem" },
    { href: "/admin/stock", label: t("admin.nav.stock"), icon: "inventory_2" },
    { href: "/admin/users", label: t("admin.nav.users"), icon: "manage_accounts" },
    { href: "/admin/locations", label: t("admin.nav.locations"), icon: "add_location" },
    { href: "/admin/notifications", label: t("admin.nav.notifications"), icon: "notifications" },
    { href: "/admin/chat", label: t("admin.nav.chat"), icon: "forum" },
    { href: "/admin/profile", label: t("admin.nav.settings"), icon: "settings" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 left-0 p-4 w-64 bg-surface-container-low border-r border-surface-variant shrink-0">
        <div className="flex items-center gap-3 mb-8 px-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src="/logo.svg" alt="Smart Eco Bank" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-primary leading-tight" style={{ fontSize: 18 }}>Admin Panel</p>
            <p className="text-label-sm font-label-sm text-outline">Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const badgeCount =
              item.href === "/admin/chat" ? chatUnreadCount :
              item.href === "/admin/notifications" ? notifUnreadCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-secondary-container text-on-secondary-container translate-x-1 font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <div className="relative shrink-0">
                  <Icon name={item.icon} fill={active} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error border border-surface" />
                  )}
                </div>
                <span className="text-body-md font-body-md flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-error text-on-error rounded-full text-[10px] font-bold">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-surface-container rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-outline-variant" />
            <div>
              <p className="text-label-sm font-label-sm font-bold">{t("admin.nav.systemStatus")}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-outline uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-surface border-t border-surface-variant">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const badgeCount =
            item.href === "/admin/chat" ? chatUnreadCount :
            item.href === "/admin/notifications" ? notifUnreadCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <div className="relative">
                <Icon name={item.icon} fill={active} style={{ fontSize: 22 }} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error border border-surface" />
                )}
              </div>
              <span className="text-[10px] font-bold leading-tight">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
