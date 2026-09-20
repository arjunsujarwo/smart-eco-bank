"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { getRewardOrderDetail } from "@/lib/api";
import type { RewardTrackingItem } from "@/lib/api";
import type { Transaction } from "@/lib/types";

// ── Status badge ─────────────────────────────────────────────────────────────
function TxStatusBadge({ status }: { status: Transaction["status"] }) {
  const { t } = useTranslation();
  if (status === "success" || status === "completed" || status === "selesai")
    return (
      <span className="px-3 py-1 bg-[#d1e7dd] text-[#0f5132] rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1">
        <Icon name="check_circle" className="text-sm" /> {t("status.success")}
      </span>
    );
  if (status === "pending")
    return (
      <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1">
        <Icon name="pending" className="text-sm" /> {t("status.pending")}
      </span>
    );
  if (status === "process")
    return (
      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="autorenew" className="text-sm" /> {t("status.process")}
      </span>
    );
  if (status === "dikemas")
    return (
      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="inventory_2" className="text-sm" /> {t("status.packed")}
      </span>
    );
  if (status === "pengiriman")
    return (
      <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1 w-fit">
        <Icon name="local_shipping" className="text-sm" /> {t("status.shipped")}
      </span>
    );
  return (
    <span className="px-3 py-1 bg-error-container text-error rounded-full text-label-sm font-label-sm font-bold inline-flex items-center gap-1">
      <Icon name="cancel" className="text-sm" /> {t("status.failed")}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<string>("process");
  const [pickupCode, setPickupCode] = useState<string | undefined>();
  const [pickupLocationName, setPickupLocationName] = useState<string | undefined>();
  const [pickupLocationAddress, setPickupLocationAddress] = useState<string | undefined>();
  const [trackingItems, setTrackingItems] = useState<RewardTrackingItem[]>([]);

  useEffect(() => {
    let txData: Transaction | null = null;
    try {
      const raw = sessionStorage.getItem(`eco_tx_${id}`);
      if (raw) {
        txData = JSON.parse(raw) as Transaction;
        setTx(txData);
        if (txData.pickupCode) setPickupCode(txData.pickupCode);
        if (txData.pickupLocationName) setPickupLocationName(txData.pickupLocationName);
      }
    } catch { }

    if (txData?.type === "redeem") {
      getRewardOrderDetail(id)
        .then(({ status, tracking, pickupCode: code, pickupLocationName: locName, pickupLocationAddress: locAddr }) => {
          setOrderStatus(status);
          if (tracking.length > 0) setTrackingItems(tracking);
          if (code) setPickupCode(code);
          if (locName) setPickupLocationName(locName);
          if (locAddr) setPickupLocationAddress(locAddr);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <Icon name="sync" className="animate-spin text-primary" style={{ fontSize: 40 }} />
            <p className="text-body-md">{t("historyDetail.loadingDetail")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!tx) {
    return (
      <AppShell>
        <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Icon name="search_off" className="text-on-surface-variant" style={{ fontSize: 64 }} />
          <p className="text-headline-md font-headline-md text-on-surface-variant">{t("historyDetail.notFound")}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-button hover:brightness-95 transition-all"
          >
            {t("common.back")}
          </button>
        </div>
      </AppShell>
    );
  }

  const isRedeem = tx.type === "redeem";
  const isSelesai = orderStatus === "selesai";

  // Pickup tracker steps — derived from trackingItems if available, else static
  const pickupSteps: { status: string; label: string; description: string; date?: string; is_completed: boolean }[] =
    trackingItems.length > 0
      ? trackingItems
      : [
          { status: "process", label: "Pesanan Diterima", description: "Pesanan telah diterima dan sedang disiapkan.", is_completed: true },
          {
            status: "pickup",
            label: `Ambil di ${pickupLocationName ?? "Posko"}`,
            description: `Tunjukkan kode pengambilan ke petugas di ${pickupLocationName ?? "posko pilihan Anda"}.`,
            is_completed: isSelesai,
          },
          { status: "selesai", label: "Selesai", description: "Reward berhasil diambil.", is_completed: isSelesai },
        ];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 md:px-container-padding-desktop py-4 md:py-stack-lg space-y-4">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-button"
        >
          <Icon name="arrow_back" />
          {t("historyDetail.backLink")}
        </button>

        {/* Header card */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRedeem ? "eco-gradient text-white" : "bg-primary-container text-on-primary-container"}`}>
                <Icon name={isRedeem ? "redeem" : tx.iconKey} fill style={{ fontSize: 24 }} />
              </div>
              <div>
                <p className="font-body-md font-bold text-on-surface text-lg leading-snug">
                  {isRedeem ? (tx.rewardName ?? t("historyDetail.defaultRewardName")) : tx.category}
                </p>
                <span className={`text-label-sm font-label-sm px-2 py-0.5 rounded-full ${isRedeem ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container/20 text-primary"}`}>
                  {isRedeem ? t("historyDetail.typeRedeem") : t("historyDetail.typeDeposit")}
                </span>
              </div>
            </div>
            <TxStatusBadge status={tx.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-outline-variant sm:grid-cols-4">
            <InfoCell label={t("historyDetail.labelTxId")} value={tx.id} mono />
            <InfoCell label={t("historyDetail.labelDate")} value={tx.date} />
            <InfoCell label={t("historyDetail.labelTime")} value={tx.timeLabel} />
            {isRedeem ? (
              <InfoCell label={t("historyDetail.labelPointsUsed")} value={`${Math.abs(tx.points ?? 0).toLocaleString("id-ID")} pts`} accent />
            ) : (
              <InfoCell label={t("historyDetail.labelPointsEarned")} value={tx.points ? `+${tx.points.toLocaleString("id-ID")} pts` : "—"} accent={!!tx.points} />
            )}
          </div>
        </div>

        {/* ── Redeem detail ── */}
        {isRedeem && (
          <>
            {/* Order info */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-4">
              <h2 className="font-body-md font-bold text-on-surface text-lg flex items-center gap-2">
                <Icon name="inventory_2" className="text-secondary" />
                {t("historyDetail.orderDetail")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <InfoCell label={t("historyDetail.labelProductName")} value={tx.rewardName ?? "—"} />
                <InfoCell label={t("historyDetail.labelPointPerItem")} value={tx.pointPerItem ? `${tx.pointPerItem.toLocaleString("id-ID")} pts` : "—"} />
                <InfoCell label={t("historyDetail.labelQty")} value={`${tx.qty ?? 1} unit`} />
                <InfoCell label={t("historyDetail.labelTotalPoints")} value={`${Math.abs(tx.points ?? 0).toLocaleString("id-ID")} pts`} accent />
              </div>
            </div>

            {/* Pickup code card */}
            {pickupCode && !isSelesai && (
              <div className="bg-surface border-2 border-primary/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="qr_code" fill className="text-primary" style={{ fontSize: 22 }} />
                  <h2 className="font-body-md font-bold text-on-surface text-lg">Kode Pengambilan</h2>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center mb-4">
                  <p className="text-4xl font-mono font-bold tracking-[0.3em] text-primary select-all">
                    {pickupCode}
                  </p>
                  <p className="text-label-sm text-on-surface-variant mt-2">Tunjukkan kode ini ke petugas posko</p>
                </div>
                {(pickupLocationName || pickupLocationAddress) && (
                  <div className="flex items-start gap-3 p-4 bg-surface-container rounded-xl">
                    <Icon name="location_on" fill className="text-primary shrink-0 mt-0.5" style={{ fontSize: 18 }} />
                    <div>
                      {pickupLocationName && <p className="font-bold text-on-surface text-sm">{pickupLocationName}</p>}
                      {pickupLocationAddress && <p className="text-label-sm text-on-surface-variant">{pickupLocationAddress}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pickup status tracker */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-6">
              <h2 className="font-body-md font-bold text-on-surface text-lg flex items-center gap-2">
                <Icon name="track_changes" className="text-secondary" />
                Status Pengambilan
              </h2>

              <div className="relative">
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-outline-variant" />
                <div className="space-y-0">
                  {pickupSteps.map((step, i, arr) => {
                    const done = step.is_completed;
                    const active = !done && (i === 0 || arr[i - 1]?.is_completed);
                    const iconName =
                      step.status === "selesai" ? "check_circle" :
                      step.status === "pickup" ? "store" : "receipt_long";
                    return (
                      <div key={step.status + i} className="flex gap-4 items-start pb-8 last:pb-0 relative">
                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-primary text-on-primary"
                            : active
                              ? "bg-primary text-on-primary ring-4 ring-primary/20"
                              : "bg-surface border-2 border-outline-variant text-on-surface-variant"
                        }`}>
                          {done && !active
                            ? <Icon name="check" style={{ fontSize: 18 }} />
                            : <Icon name={iconName} fill={done || active} style={{ fontSize: 18 }} />
                          }
                        </div>
                        <div className="flex-grow pt-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-body-md font-bold ${done || active ? "text-on-surface" : "text-on-surface-variant"}`}>
                              {step.label}
                            </p>
                            {active && (
                              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-label-sm">Aktif</span>
                            )}
                            {step.status === "selesai" && done && (
                              <span className="px-2 py-0.5 bg-[#d1e7dd] text-[#0f5132] rounded-full text-label-sm font-label-sm">Selesai</span>
                            )}
                          </div>
                          <p className={`text-label-sm font-label-sm mt-0.5 ${done || active ? "text-on-surface-variant" : "text-outline"}`}>
                            {step.description}
                          </p>
                          {step.is_completed && step.date && (
                            <p className="text-xs text-outline mt-1">{step.date}</p>
                          )}
                          {/* Show code inline on pickup step if not yet done */}
                          {step.status === "pickup" && !done && pickupCode && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
                              <Icon name="qr_code" className="text-primary" style={{ fontSize: 16 }} />
                              <span className="font-mono font-bold text-primary tracking-widest text-sm">{pickupCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Done state */}
              {isSelesai && (
                <div className="pt-4 border-t border-outline-variant flex items-center gap-3 p-4 bg-[#d1e7dd]/40 border border-[#0f5132]/20 rounded-xl">
                  <Icon name="check_circle" fill className="text-[#0f5132] shrink-0" style={{ fontSize: 28 }} />
                  <div>
                    <p className="font-body-md font-bold text-[#0f5132]">Pengambilan Terverifikasi</p>
                    <p className="text-label-sm text-on-surface-variant">Reward Anda telah berhasil diambil di posko.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Deposit detail ── */}
        {!isRedeem && (
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 md:p-6 space-y-3">
            <h2 className="font-body-md font-bold text-on-surface text-lg flex items-center gap-2">
              <Icon name="recycling" className="text-primary" />
              Detail Setoran
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <InfoCell label="KATEGORI SAMPAH" value={tx.category} />
              <InfoCell label="BERAT" value={tx.weightGram != null ? `${tx.weightGram} g` : "—"} />
              <InfoCell label="POIN DIPEROLEH" value={tx.points ? `+${tx.points.toLocaleString("id-ID")} pts` : "Menunggu validasi"} accent={!!tx.points} />
              <InfoCell label="STATUS" value={
                (tx.status === "success" || tx.status === "completed") ? "Tervalidasi" :
                tx.status === "pending" ? "Menunggu Validasi" :
                tx.status === "process" ? "Diproses" : "Ditolak"
              } />
            </div>
            {tx.status === "pending" && (
              <div className="flex items-start gap-3 p-4 bg-tertiary-container/20 border border-tertiary/20 rounded-xl">
                <Icon name="info" fill className="text-tertiary shrink-0 mt-0.5" />
                <p className="text-body-md text-on-surface-variant text-sm leading-relaxed">
                  Admin sedang memverifikasi setoran Anda. Proses validasi berlangsung dalam 1×24 jam di hari kerja.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}

function InfoCell({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-label-sm font-label-sm text-outline">{label}</p>
      <p className={`font-bold text-body-md break-words ${accent ? "text-primary" : "text-on-surface"} ${mono ? "font-label-sm text-label-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}
