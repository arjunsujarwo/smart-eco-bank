"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { getTransactions } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import type { Transaction } from "@/lib/types";

function navigateToDetail(router: ReturnType<typeof useRouter>, t: Transaction) {
  try {
    sessionStorage.setItem(`eco_tx_${t.id}`, JSON.stringify(t));
  } catch { }
  router.push(`/history/${t.id}`);
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const FILTERS = [
    { key: "all" as const, label: t("history.filterAll") },
    { key: "deposit" as const, label: t("history.filterDeposit") },
    { key: "redeem" as const, label: t("history.filterRedeem") },
  ];

  const [filter, setFilter] = useState<"all" | "deposit" | "redeem">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [totalPoint, setTotalPoint] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileVisible, setMobileVisible] = useState(6);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Always load all — filter client-side (mobile tabs + desktop chips)
  useEffect(() => {
    setLoading(true);
    getTransactions("all")
      .then(({ transactions, totalPoint: tp }) => {
        setTxs(transactions);
        setTotalPoint(tp);
        setLoading(false);
      })
      .catch((e) => {
        showToast(e instanceof Error ? e.message : "Gagal memuat riwayat", "error");
        setLoading(false);
      });
  }, [showToast]);

  function matchSearch(tx: Transaction) {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tx.id.toString().toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
  }

  // Desktop: driven by filter chips
  const filteredTxs = txs.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    return matchSearch(tx);
  });

  const allMobileTxs = txs.filter(matchSearch);
  const mobileTxs = allMobileTxs.slice(0, mobileVisible);
  const hasMore = mobileVisible < allMobileTxs.length;

  const onSentinel = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting) setMobileVisible((v) => v + 6);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(onSentinel, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onSentinel, loading]);

  return (
    <AppShell>
      {toast && <Toast {...toast} />}
      <div className="max-w-[1280px] mx-auto px-4 md:px-container-padding-desktop py-4 md:py-stack-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4 md:mb-stack-lg">
          <div>
            <h1 className="text-xl md:text-headline-lg font-headline-lg text-primary mb-1">
              {t("history.title")}
            </h1>
            <p className="hidden md:block text-body-md text-on-surface-variant max-w-2xl">
              {t("history.subtitle")}
            </p>
          </div>
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("history.searchPlaceholder")}
              className="pl-10 pr-4 py-2 bg-surface-container border-none rounded-xl text-body-md focus:ring-2 focus:ring-primary w-full md:w-64 outline-none"
            />
          </div>
        </div>

        {/* Filter chips — desktop only */}
        <div className="hidden md:flex gap-stack-sm mb-stack-md flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-button font-button transition-colors ${
                filter === f.key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex mb-4 border-b border-outline-variant">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors border-b-2 -mb-px border-primary text-primary"
          >
            <Icon name="receipt_long" fill className="text-[18px]" />
            Riwayat
          </button>
          <Link
            href="/rewards"
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors border-b-2 -mb-px border-transparent text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="redeem" className="text-[18px]" />
            Reward Redeem
          </Link>
        </div>

        {/* Mobile card list */}
        {!loading && (
          <div className="md:hidden space-y-3 mb-4">
            {mobileTxs.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <Icon name="receipt_long" style={{ fontSize: 48 }} className="opacity-20 mb-3" />
                <p className="text-sm">Belum ada riwayat transaksi</p>
              </div>
            )}
            {mobileTxs.map((t) => (
              <button
                key={t.id}
                onClick={() => navigateToDetail(router, t)}
                className="w-full text-left bg-surface border border-outline-variant rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.99] flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <Icon name={t.iconKey} fill />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-on-surface text-sm truncate">{t.category}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-sm text-on-surface-variant">{t.date} · {t.timeLabel}</span>
                    {t.points && (
                      <span className={`font-bold text-sm shrink-0 ${t.type === "redeem" ? "text-error" : "text-primary"}`}>
                        {t.type === "redeem" ? "-" : "+"}{t.points.toLocaleString("id-ID")} Pts
                      </span>
                    )}
                  </div>
                  <span className="text-label-sm text-outline font-label-sm">#{t.id}</span>
                </div>
                <Icon name="chevron_right" className="text-on-surface-variant shrink-0" />
              </button>
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <Icon name="more_horiz" className="text-on-surface-variant animate-pulse" style={{ fontSize: 24 }} />
              </div>
            )}
          </div>
        )}

        {/* Table (desktop only) */}
        <div className="hidden md:block bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-surface-variant">
                  {[t("history.tableDate"), t("history.tableId"), t("history.tableCategory"), t("history.tableWeight"), t("history.tablePoints"), t("history.tableStatus"), ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 font-button text-label-sm uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-on-surface-variant"
                    >
                      {t("history.loadingTx")}
                    </td>
                  </tr>
                ) : filteredTxs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-on-surface-variant"
                    >
                      {t("history.noTx")}
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigateToDetail(router, t)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-body-md font-bold">{t.date}</span>
                          <span className="text-label-sm text-on-surface-variant">
                            {t.timeLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-label-sm font-label-sm text-primary">
                        {t.id}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Icon name={t.iconKey} className="text-secondary" />
                          <span className="text-body-md">{t.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-headline-md text-primary">
                        {t.weightGram != null ? t.weightGram : "—"}
                        {t.weightGram != null && (
                          <span className="text-label-sm font-normal text-on-surface-variant">
                            {" "}g
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-5 font-bold ${t.type === "redeem" ? "text-error" : "text-primary-container"}`}>
                        {t.points
                          ? `${t.type === "redeem" ? "-" : "+"}${t.points.toLocaleString("id-ID")} Pts`
                          : "—"}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-5 text-on-surface-variant">
                        <Icon name="chevron_right" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
            <span className="text-label-sm text-on-surface-variant">
              {t("history.showing")} {filteredTxs.length} {t("history.transactions")}
            </span>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-outline-variant text-on-surface-variant opacity-50">
                <Icon name="chevron_left" />
              </button>
              <button className="px-3 py-1 rounded-lg bg-primary text-on-primary text-label-sm font-bold">
                1
              </button>
              <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-variant transition-all">
                <Icon name="chevron_right" />
              </button>
            </div>
          </div>
        </div>

        {/* Impact summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mt-stack-lg">
          <div className="md:col-span-1 bg-primary-container/10 p-6 rounded-xl border border-primary/20 relative overflow-hidden">
            <h3 className="text-body-md font-bold text-primary mb-2">
              {t("history.totalPoints")}
            </h3>
            <div className="text-headline-lg font-headline-lg text-primary">
              {totalPoint.toLocaleString("id-ID")} Pts
            </div>
            <p className="text-label-sm text-on-surface-variant mt-2">
              {t("history.totalPointsDesc")}
            </p>
            <Icon
              name="savings"
              className="absolute -right-4 -bottom-4 opacity-10 text-primary"
              style={{ fontSize: 120 }}
            />
          </div>
          <div className="md:col-span-2 bg-surface-container-low p-6 rounded-xl border border-surface-variant flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-28 h-28 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#e1e3e4"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="#006d37"
                  strokeWidth="12"
                  strokeDasharray="364.42"
                  strokeDashoffset="91.1"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-headline-md font-headline-md text-primary">
                  75%
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-body-lg font-headline-md text-on-surface mb-2">
                {t("history.weeklyTarget")}
              </h3>
              <p className="text-body-md text-on-surface-variant">
                {t("history.weeklyDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: import("@/lib/types").TxStatus }) {
  const { t } = useTranslation();
  if (status === "success" || status === "completed" || status === "selesai")
    return (
      <span className="px-3 py-1 bg-[#d1e7dd] text-[#0f5132] rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="check_circle" className="text-[14px]" /> {t("status.success")}
      </span>
    );
  if (status === "pending")
    return (
      <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="pending" className="text-[14px]" />
        <span className="hidden sm:inline">{t("status.pending")}</span>
        <span className="sm:hidden">{t("status.pendingShort")}</span>
      </span>
    );
  if (status === "process")
    return (
      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="autorenew" className="text-[14px]" /> {t("status.process")}
      </span>
    );
  if (status === "dikemas")
    return (
      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="inventory_2" className="text-[14px]" /> {t("status.packed")}
      </span>
    );
  if (status === "pengiriman")
    return (
      <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="local_shipping" className="text-[14px]" /> {t("status.shipped")}
      </span>
    );
  return (
    <span className="px-3 py-1 bg-error-container text-error rounded-full text-label-sm font-bold inline-flex items-center gap-1 w-fit">
      <Icon name="cancel" className="text-[14px]" /> {t("status.failed")}
    </span>
  );
}
