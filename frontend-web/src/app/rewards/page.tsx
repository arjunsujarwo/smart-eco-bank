"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { getRewards, redeemReward } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import type { Reward } from "@/lib/types";
import PinVerificationModal from "@/components/PinVerificationModal";

export default function RewardsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toast, showToast } = useToast();
  const [category, setCategory] = useState("All");
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeeming, setRedeeming] = useState<Reward | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const BALANCE = user?.pointBalance ?? 0;

  const categories = ["All", ...Array.from(new Set(allRewards.map((r) => r.category).filter(Boolean)))];

  useEffect(() => {
    getRewards("All")
      .then((data) => {
        setAllRewards(data);
        setRewards(data);
      })
      .catch((e) => showToast(e instanceof Error ? e.message : "Gagal memuat reward", "error"));
  }, [showToast]);

  useEffect(() => {
    setRewards(category === "All" ? allRewards : allRewards.filter((r) => r.category === category));
  }, [category, allRewards]);

  function openRedeem(r: Reward) {
    setQty(1);
    setSelectedLocationId(null);
    setRedeeming(r);
  }

  function handleQtyChange(next: number) {
    setQty(next);
    // Reset location if it no longer has enough stock for the new qty
    if (selectedLocationId !== null && redeeming) {
      const locStock = redeeming.locationStocks.find((ls) => ls.locationId === selectedLocationId);
      if (!locStock || locStock.stock < next) {
        setSelectedLocationId(null);
      }
    }
  }

  async function confirmRedeem() {
    if (!redeeming || selectedLocationId === null) return;
    if (user?.hasPin) {
      setShowPinModal(true);
      return;
    }
    await performRedeem();
  }

  async function performRedeem() {
    if (!redeeming || selectedLocationId === null) return;
    const name = redeeming.name;
    const locId = selectedLocationId;
    setRedeeming(null);
    try {
      await redeemReward(redeeming.id, qty, locId);
      setSuccessName(name);
      refreshUser();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Penukaran reward gagal", "error");
    }
  }

  return (
    <AppShell>
      {toast && <Toast {...toast} />}

      {/* Mobile tab bar — mirrors history page tab bar */}
      <div className="md:hidden flex border-b border-outline-variant">
        <Link
          href="/history"
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 -mb-px border-transparent text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="receipt_long" className="text-[18px]" />
          Riwayat
        </Link>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 -mb-px border-primary text-primary"
        >
          <Icon name="redeem" fill className="text-[18px]" />
          Reward Redeem
        </button>
      </div>

      <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg">
        {/* Hero */}
        <section className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <span className="text-label-sm font-label-sm text-primary tracking-widest">
              {t("rewards.programLabel")}
            </span>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">
              {t("rewards.title")}
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
              {t("rewards.subtitle")}
            </p>
          </div>
          <div className="bg-primary-container p-6 rounded-xl flex items-center gap-4 shadow-sm border border-primary/10">
            <div className="bg-on-primary-container p-3 rounded-full">
              <Icon name="energy_savings_leaf" fill className="text-surface" />
            </div>
            <div>
              <p className="text-label-sm font-label-sm text-on-primary-container opacity-80">
                {t("rewards.availablePoints")}
              </p>
              <p className="text-headline-md font-headline-md text-on-primary-container">
                {BALANCE.toLocaleString("id-ID")} pts
              </p>
            </div>
          </div>
        </section>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-stack-lg overflow-x-auto pb-2 hide-scrollbar">
          {categories.map((c: string) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-button font-button transition-colors ${
                category === c
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container hover:bg-surface-variant text-on-surface-variant"
              }`}
            >
              {c === "All" ? t("rewards.categoryAll") : c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {rewards.map((r) => {
            const stockPct = Math.round((r.stock / r.stockMax) * 100);
            const lowStock = stockPct < 20;
            const affordable = BALANCE >= r.pointCost;
            const hasStock = r.stock > 0;
            return (
              <article
                key={r.id}
                className="group bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-container flex items-center justify-center">
                  <img
                    src={r.image || "/images/noimages.svg"}
                    alt={r.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/noimages.svg"; }}
                  />
                  {r.badge && (
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1 rounded-full text-label-sm font-label-sm ${
                          r.badge === "Limited"
                            ? "bg-error text-on-error"
                            : "bg-primary text-on-primary"
                        }`}
                      >
                        {r.badge}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-headline-md font-headline-md text-on-surface">
                      {r.name}
                    </h3>
                    <span className="text-primary font-bold text-lg whitespace-nowrap">
                      {r.pointCost.toLocaleString("id-ID")} pts
                    </span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant mb-6 line-clamp-2">
                    {r.description}
                  </p>
                  <div className="mt-auto space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-label-sm font-label-sm">
                        <span className={lowStock ? "text-error font-bold" : "text-on-surface-variant"}>
                          {lowStock ? t("rewards.stockLow") : t("rewards.stockAvailable")}
                        </span>
                        <span className="text-on-surface font-bold">{r.stock} {t("rewards.unit")}</span>
                      </div>
                      <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${lowStock ? "bg-error" : "bg-primary"}`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => openRedeem(r)}
                      disabled={!affordable || !hasStock}
                      className="w-full py-4 bg-primary text-on-primary rounded-xl font-button text-button hover:bg-surface-tint active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="redeem" />
                      {!hasStock ? "Stok Habis" : affordable ? t("rewards.redeemBtn") : t("rewards.insufficientPoints")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── Confirm + Quantity + Location dialog ── */}
      {redeeming && (
        <Overlay onClose={() => setRedeeming(null)}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl eco-gradient flex items-center justify-center shrink-0">
              <Icon name="redeem" fill className="text-white" style={{ fontSize: 28 }} />
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface leading-snug">
                {redeeming.name}
              </h3>
              <span className="text-label-sm font-label-sm text-primary">
                {redeeming.category}
              </span>
            </div>
          </div>

          <p className="text-body-md font-body-md text-on-surface-variant mb-6 leading-relaxed">
            {redeeming.description}
          </p>

          {/* Qty picker */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-4">
            <p className="text-label-sm font-label-sm text-outline mb-3">{t("rewards.qty")}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleQtyChange(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors text-on-surface disabled:opacity-40"
                disabled={qty <= 1}
              >
                <Icon name="remove" />
              </button>
              <span className="text-headline-md font-headline-md text-on-surface w-12 text-center">
                {qty}
              </span>
              <button
                onClick={() => handleQtyChange(Math.min(redeeming.stock, qty + 1))}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors text-on-surface disabled:opacity-40"
                disabled={qty >= redeeming.stock}
              >
                <Icon name="add" />
              </button>
            </div>
          </div>

          {/* Location picker */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-4">
            <p className="text-label-sm font-label-sm text-outline mb-3">Posko Pengambilan</p>
            {redeeming.locationStocks.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant text-center py-2">
                Stok belum tersedia di posko manapun
              </p>
            ) : (
              <div className="space-y-2">
                {redeeming.locationStocks.map((ls) => {
                  const enough = ls.stock >= qty;
                  const selected = selectedLocationId === ls.locationId;
                  return (
                    <button
                      key={ls.locationId}
                      onClick={() => enough && setSelectedLocationId(ls.locationId)}
                      disabled={!enough}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                        selected
                          ? "border-primary bg-primary/10"
                          : enough
                            ? "border-outline-variant hover:border-primary/50 hover:bg-surface-container"
                            : "border-outline-variant opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary" : "border-outline-variant"}`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-body-md font-body-md text-on-surface font-medium">{ls.locationName}</p>
                          {ls.address && (
                            <p className="text-label-sm font-label-sm text-on-surface-variant line-clamp-1">{ls.address}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-label-sm font-label-sm font-bold shrink-0 ml-2 ${enough ? "text-primary" : "text-on-surface-variant"}`}>
                        {ls.stock} unit
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Point summary */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
            <div className="text-body-md font-body-md text-on-surface-variant">
              {t("rewards.totalDeducted")}
            </div>
            <div className="flex items-center gap-1.5 text-primary font-bold text-lg">
              <Icon name="eco" fill className="text-xl" />
              {(redeeming.pointCost * qty).toLocaleString("id-ID")} pts
            </div>
          </div>

          {BALANCE < redeeming.pointCost * qty && (
            <p className="text-error text-label-sm font-label-sm mb-4 flex items-center gap-1">
              <Icon name="warning" className="text-base" />
              {t("rewards.insufficientQty")}
            </p>
          )}

          {selectedLocationId === null && redeeming.locationStocks.length > 0 && (
            <p className="text-on-surface-variant text-label-sm font-label-sm mb-4 flex items-center gap-1">
              <Icon name="info" className="text-base" />
              Pilih posko pengambilan untuk melanjutkan
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setRedeeming(null)}
              className="flex-1 py-3 border border-outline rounded-xl font-button hover:bg-surface-variant transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmRedeem}
              disabled={BALANCE < redeeming.pointCost * qty || selectedLocationId === null}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icon name="redeem" />
              {t("rewards.redeemNow")}
            </button>
          </div>
        </Overlay>
      )}

      {/* ── Success ── */}
      {successName && (
        <Overlay onClose={() => setSuccessName(null)}>
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container mx-auto mb-4">
            <Icon name="check_circle" fill style={{ fontSize: 40 }} />
          </div>
          <h3 className="text-headline-md font-headline-md text-primary text-center">
            {t("rewards.successTitle")}
          </h3>
          <p className="text-body-md text-on-surface-variant text-center mt-2 mb-6">
            <span className="font-bold text-on-surface">{successName}</span> {t("rewards.successDesc")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSuccessName(null)}
              className="flex-1 py-3 border border-outline rounded-xl font-button hover:bg-surface-variant transition-colors"
            >
              {t("common.close")}
            </button>
            <button
              onClick={() => { setSuccessName(null); router.push("/history"); }}
              className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-button hover:brightness-95 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="receipt_long" />
              {t("rewards.viewTransaction")}
            </button>
          </div>
        </Overlay>
      )}

      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          performRedeem();
        }}
        isAdmin={false}
      />
    </AppShell>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
