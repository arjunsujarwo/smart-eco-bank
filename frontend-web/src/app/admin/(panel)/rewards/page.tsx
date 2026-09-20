"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { getAdminRewardOrders, verifyRewardPickup } from "@/lib/adminApi";
import type { AdminRewardOrder, RewardOrderStatus } from "@/lib/adminTypes";
import { useTranslation } from "react-i18next";

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

const STATUS_CONFIG: Record<RewardOrderStatus, { label: string; icon: string; color: string; badge: string }> = {
  menunggu:   { label: "Menunggu Verifikasi", icon: "pending_actions",  color: "text-tertiary",   badge: "bg-tertiary-container/30 text-tertiary" },
  dikemas:    { label: "Sedang Dikemas",       icon: "inventory_2",      color: "text-secondary",  badge: "bg-secondary-container/30 text-secondary" },
  pengiriman: { label: "Dikirim",              icon: "local_shipping",   color: "text-primary",    badge: "bg-primary-container/20 text-primary" },
  selesai:    { label: "Selesai",              icon: "check_circle",     color: "text-[#0f5132]",  badge: "bg-[#d1e7dd] text-[#0f5132]" },
};

function StatusBadge({ status }: { status: RewardOrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
      <Icon name={cfg.icon} fill style={{ fontSize: 13 }} />
      {cfg.label}
    </span>
  );
}

export default function AdminRewardsPage() {
  const [orders, setOrders] = useState<AdminRewardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RewardOrderStatus | "all">("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Verify modal state
  const [verifyTarget, setVerifyTarget] = useState<AdminRewardOrder | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    getAdminRewardOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function openVerify(order: AdminRewardOrder) {
    setVerifyCode("");
    setVerifyTarget(order);
  }

  async function handleVerify() {
    if (!verifyTarget || !verifyCode.trim()) return;
    setVerifying(true);
    try {
      await verifyRewardPickup(verifyTarget.id, verifyCode.trim());
      setOrders((prev) => prev.map((o) => o.id === verifyTarget.id ? { ...o, status: "selesai" } : o));
      showToast("Pengambilan berhasil diverifikasi");
      setVerifyTarget(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Verifikasi gagal", "error");
    } finally {
      setVerifying(false);
    }
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = orders.reduce<Record<string, number>>((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
  const needsAction = counts.menunggu ?? 0;

  const FILTERS: { key: RewardOrderStatus | "all"; label: string }[] = [
    { key: "all", label: `Semua (${orders.length})` },
    { key: "menunggu", label: `Menunggu Verifikasi (${counts.menunggu ?? 0})` },
    { key: "selesai", label: `Selesai (${counts.selesai ?? 0})` },
  ];

  const STAT_ITEMS = (["menunggu", "selesai"] as RewardOrderStatus[]);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">{t("admin.rewards.title")}</h1>
          <p className="text-label-sm font-label-sm text-on-surface-variant hidden md:block">{t("admin.rewards.subtitle")}</p>
        </div>
        {needsAction > 0 && (
          <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-label-sm font-bold">
            {needsAction} {t("admin.rewards.needsAction")}
          </span>
        )}
      </header>

      <div className="flex-1 px-4 md:px-10 py-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-on-surface">{t("admin.rewards.title")}</h2>
          <p className="text-sm text-on-surface-variant mt-1">Verifikasi pengambilan reward dengan kode unik dari pelanggan.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STAT_ITEMS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-3">
                <Icon name={cfg.icon} fill className={cfg.color} style={{ fontSize: 22 }} />
                <div>
                  <p className="text-xs text-outline font-bold uppercase tracking-wide">{cfg.label}</p>
                  <p className="text-xl font-bold text-on-surface">{counts[s] ?? 0}</p>
                </div>
              </div>
            );
          })}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-3">
            <Icon name="receipt_long" fill className="text-primary" style={{ fontSize: 22 }} />
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wide">Total Pesanan</p>
              <p className="text-xl font-bold text-on-surface">{orders.length}</p>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                filter === f.key ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mobile cards */}
        {!loading && (
          <div className="md:hidden space-y-3 mb-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Icon name="inventory_2" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                <p>{t("admin.rewards.noOrders")}</p>
              </div>
            ) : filtered.map((order) => (
              <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-on-surface text-sm">{order.userName}</p>
                    <p className="text-xs text-outline">#{order.id} · {fmtDate(order.createdAt)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">{order.rewardName}</p>
                  <p className="text-xs text-on-surface-variant">{order.qty}× · {order.pointPerItem.toLocaleString("id-ID")} pts/item</p>
                </div>
                {order.pickupLocationName && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Icon name="location_on" style={{ fontSize: 14 }} className="text-primary shrink-0" />
                    <span>{order.pickupLocationName}</span>
                  </div>
                )}
                {order.status === "menunggu" && (
                  <button
                    onClick={() => openVerify(order)}
                    className="w-full py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="qr_code_scanner" style={{ fontSize: 16 }} />
                    Verifikasi Pengambilan
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {["#", "Pelanggan", "Reward", "Qty / Poin", "Posko Pengambilan", "Status", "Tanggal", "Aksi"].map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">{t("admin.rewards.loading")}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-on-surface-variant">
                      <Icon name="inventory_2" style={{ fontSize: 48 }} className="opacity-30 mb-2" />
                      <p>{t("admin.rewards.noOrders")}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-bright transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-outline">#{order.id}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-on-surface text-sm">{order.userName}</p>
                        <p className="text-xs text-outline">{order.userPhone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-on-surface text-sm">{order.rewardName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-on-surface">{order.qty}×</p>
                        <p className="text-xs text-primary font-bold">{order.totalPoints.toLocaleString("id-ID")} pts</p>
                      </td>
                      <td className="px-5 py-4">
                        {order.pickupLocationName ? (
                          <div className="flex items-center gap-1.5">
                            <Icon name="location_on" style={{ fontSize: 14 }} className="text-primary shrink-0" />
                            <span className="text-sm text-on-surface">{order.pickupLocationName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-outline italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">{fmtDate(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        {order.status === "menunggu" ? (
                          <button
                            onClick={() => openVerify(order)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-95 active:scale-95 transition-all whitespace-nowrap"
                          >
                            <Icon name="qr_code_scanner" style={{ fontSize: 14 }} />
                            Verifikasi
                          </button>
                        ) : (
                          <span className="text-xs text-outline italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setVerifyTarget(null)}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary p-5">
              <h3 className="font-bold text-white text-lg">Verifikasi Pengambilan</h3>
              <p className="text-white/80 text-xs mt-0.5">Masukkan kode unik yang ditunjukkan pelanggan</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Order summary */}
              <div className="bg-surface-container rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-outline font-bold uppercase">Pelanggan</span>
                  <span className="text-sm font-bold text-on-surface">{verifyTarget.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-outline font-bold uppercase">Reward</span>
                  <span className="text-sm font-bold text-on-surface">{verifyTarget.rewardName} ×{verifyTarget.qty}</span>
                </div>
                {verifyTarget.pickupLocationName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-outline font-bold uppercase">Posko</span>
                    <span className="text-sm font-bold text-on-surface">{verifyTarget.pickupLocationName}</span>
                  </div>
                )}
              </div>

              {/* Code input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase">Kode Pengambilan</label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  maxLength={8}
                  placeholder="Contoh: AB1CD2"
                  className="w-full p-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-center text-xl font-mono font-bold tracking-widest uppercase"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setVerifyTarget(null)}
                  className="flex-1 py-3 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerify}
                  disabled={!verifyCode.trim() || verifying}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} />
                  ) : (
                    <Icon name="verified" style={{ fontSize: 16 }} />
                  )}
                  {verifying ? "Memverifikasi..." : "Verifikasi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <div className={`${toast.type === "error" ? "bg-error-container border border-error/20" : "bg-on-background"} rounded-xl px-5 py-4 shadow-xl flex items-center gap-3`}>
            <Icon name={toast.type === "error" ? "error" : "check_circle"} fill className={toast.type === "error" ? "text-error" : "text-primary-fixed"} />
            <p className={`text-sm font-medium ${toast.type === "error" ? "text-error" : "text-surface"}`}>{toast.msg}</p>
          </div>
        </div>
      )}
    </>
  );
}
