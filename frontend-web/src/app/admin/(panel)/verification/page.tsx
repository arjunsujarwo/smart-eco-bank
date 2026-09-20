"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import Icon from "@/components/ui/Icon";
import {
  getAdminVerifications,
  approveVerification,
  rejectVerification,
} from "@/lib/adminApi";
import { BASE_URL } from "@/lib/api";
import type { ApproveResult } from "@/lib/adminApi";
import type { AdminVerification, AdminCategory } from "@/lib/adminTypes";

function StatsCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: string;
  variant: "primary" | "tertiary" | "error";
}) {
  const styles = {
    primary: "bg-primary-container/20 text-primary",
    tertiary: "bg-tertiary-container/30 text-tertiary",
    error: "bg-error-container text-error",
  };
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${styles[variant]}`}>
        <Icon name={icon} fill style={{ fontSize: 22 }} />
      </div>
      <div>
        <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider">{label}</p>
        <p className="text-headline-md font-headline-md font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-bold text-outline uppercase shrink-0">{label}</span>
      <span className="font-bold text-on-surface text-sm text-right">{value}</span>
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminVerificationPage() {
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState<AdminVerification[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminVerification | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);

  // approve form state
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [weightGram, setWeightGram] = useState("");

  // reject form state
  const [rejectReason, setRejectReason] = useState("");

  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [qrResult, setQrResult] = useState<ApproveResult | null>(null);

  useEffect(() => {
    getAdminVerifications()
      .then(({ items: data, categories: cats }) => {
        setAllItems(data);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  function openModal(item: AdminVerification, type: "approve" | "reject") {
    setSelected(item);
    setModalType(type);
    // pre-fill from response data
    setProductName(item.aiCategory);
    setCategoryId(String(item.categoryId));
    setWeightGram(String(item.weightGram));
    setRejectReason("");
  }

  function closeModal() {
    if (processing) return;
    setSelected(null);
    setModalType(null);
    setProductName("");
    setCategoryId("");
    setWeightGram("");
    setRejectReason("");
  }

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleConfirm() {
    if (!selected || !modalType) return;
    setProcessing(true);
    try {
      if (modalType === "approve") {
        const result = await approveVerification(selected.id, {
          productName: productName.trim(),
          categoryId: Number(categoryId),
          weightGram: parseFloat(weightGram),
        });
        setAllItems((prev) =>
          prev.map((i) => i.id === selected.id ? { ...i, status: "completed" as const } : i),
        );
        closeModal();
        showToast(t("admin.verification.approveSuccess"));
        setQrResult(result);
      } else {
        await rejectVerification(
          selected.id,
          rejectReason.trim() || "Tidak memenuhi syarat",
        );
        setAllItems((prev) =>
          prev.map((i) => i.id === selected.id ? { ...i, status: "rejected" as const } : i),
        );
        closeModal();
        showToast(t("admin.verification.rejectSuccess"));
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
    } finally {
      setProcessing(false);
    }
  }

  const items         = allItems.filter((i) => i.status === "pending");
  const history       = allItems.filter((i) => i.status === "completed" || i.status === "rejected");
  const approvedCount = allItems.filter((i) => i.status === "completed" || i.status === "approved").length;
  const rejectedCount = allItems.filter((i) => i.status === "rejected").length;

  const canApprove =
    productName.trim().length > 0 &&
    Number(categoryId) > 0 &&
    parseFloat(weightGram) > 0;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 py-4 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="text-headline-md font-headline-md font-bold text-primary">{t("admin.verification.title")}</h1>
          <p className="text-label-sm text-on-surface-variant hidden md:block">
            {t("admin.verification.subtitle")}
          </p>
        </div>
        {items.length > 0 && (
          <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-label-sm font-bold">
            {items.length} Menunggu
          </span>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 px-4 md:px-10 py-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-on-surface">{t("admin.verification.queueTitle")}</h2>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {t("admin.verification.queueSubtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard label={t("admin.verification.statsPending")} value={loading ? "…" : items.length} icon="pending_actions" variant="tertiary" />
          <StatsCard label={t("admin.verification.statsApproved")} value={loading ? "…" : approvedCount} icon="check_circle" variant="primary" />
          <StatsCard label={t("admin.verification.statsRejected")} value={loading ? "…" : rejectedCount} icon="cancel" variant="error" />
        </div>

        {/* Mobile cards */}
        {!loading && (
          <div className="md:hidden space-y-3 mb-4">
            {items.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <Icon name="check_circle" fill className="text-primary opacity-50" style={{ fontSize: 48 }} />
                <p className="mt-2 font-bold text-on-surface">Semua setoran terverifikasi!</p>
              </div>
            ) : items.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-on-surface">{item.userName}</p>
                    <p className="text-xs text-outline">#{item.id} · {formatDate(item.submittedAt)}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-primary-container/20 text-primary rounded-full text-xs font-bold shrink-0">
                    {item.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-on-surface-variant">
                    <strong className="text-on-surface">{item.weightGram} g</strong> · {item.earnedPoints} pts
                  </span>
                  <span className="text-on-surface-variant">
                    AI: <strong className="text-on-surface">{item.confidence}%</strong>
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2">{item.aiMessage}</p>
                <div className="flex gap-2">
                  <button onClick={() => openModal(item, "approve")}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold">
                    <Icon name="check" style={{ fontSize: 16 }} /> {t("admin.verification.approve")}
                  </button>
                  <button onClick={() => openModal(item, "reject")}
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-error text-error rounded-lg text-sm font-bold">
                    <Icon name="close" style={{ fontSize: 16 }} /> {t("admin.verification.reject")}
                  </button>
                </div>
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
                  {[t("admin.verification.tableUser"), t("admin.verification.tableCategory"), "Lokasi", t("admin.verification.tableWeight"), t("admin.verification.labelConfidence"), t("admin.verification.tableActions")].map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">{t("admin.verification.loading")}</td></tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                        <Icon name="check_circle" fill className="text-primary" style={{ fontSize: 56 }} />
                        <p className="font-bold text-on-surface">{t("admin.verification.noData")}</p>
                      </div>
                    </td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-bright transition-colors">
                    {/* Nasabah */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0">
                          <Icon name="person" className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">{item.userName}</p>
                          <p className="text-xs text-outline">#{item.id}</p>
                          <p className="text-xs text-on-surface-variant">{formatDate(item.submittedAt)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Kategori & AI */}
                    <td className="px-5 py-4 max-w-[220px]">
                      <span className="px-2 py-0.5 bg-primary-container/20 text-primary rounded-full text-xs font-bold">
                        {item.categoryName}
                      </span>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.aiMessage}</p>
                    </td>
                    {/* Lokasi */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface text-sm">{item.locationName}</p>
                      <p className="text-xs text-on-surface-variant">{item.locationAddress}</p>
                    </td>
                    {/* Berat / Poin */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{item.weightGram} g</p>
                      <p className="text-xs text-primary font-bold">+{item.earnedPoints} pts</p>
                    </td>
                    {/* Kepercayaan */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-on-surface">{item.confidence}%</span>
                        <Icon
                          name={item.confidence >= 80 ? "verified" : "warning"}
                          fill
                          className={item.confidence >= 80 ? "text-primary" : "text-tertiary"}
                          style={{ fontSize: 16 }}
                        />
                      </div>
                    </td>
                    {/* Aksi */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(item, "approve")}
                          className="flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:brightness-95 active:scale-95 transition-all">
                          <Icon name="check" style={{ fontSize: 14 }} /> {t("admin.verification.approve")}
                        </button>
                        <button onClick={() => openModal(item, "reject")}
                          className="flex items-center gap-1 px-4 py-2 border border-error text-error rounded-lg text-xs font-bold hover:bg-error-container transition-all">
                          <Icon name="close" style={{ fontSize: 14 }} /> {t("admin.verification.reject")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Riwayat — completed + rejected */}
        {!loading && history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-on-surface mb-4">Riwayat Verifikasi</h2>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {history.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-on-surface text-sm">{item.userName}</p>
                      <p className="text-xs text-outline">#{item.id} · {formatDate(item.submittedAt)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      item.status === "completed"
                        ? "bg-primary-container/20 text-primary"
                        : "bg-error-container text-error"
                    }`}>
                      {item.status === "completed" ? t("admin.verification.statusApproved") : t("admin.verification.statusRejected")}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {item.categoryName} · {item.weightGram} g · +{item.earnedPoints} pts
                  </p>
                  {item.status === "rejected" && item.rejectionReason && (
                    <p className="text-xs text-error">Alasan: {item.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      {[t("admin.verification.tableUser"), t("admin.verification.tableCategory"), "Lokasi", t("admin.verification.tableWeight"), t("admin.verification.tableDate"), t("admin.verification.tableStatus")].map((h) => (
                        <th key={h} className="px-5 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-bright transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-on-surface text-sm">{item.userName}</p>
                          <p className="text-xs text-outline">#{item.id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-0.5 bg-primary-container/20 text-primary rounded-full text-xs font-bold">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-on-surface">{item.locationName}</p>
                          <p className="text-xs text-on-surface-variant">{item.locationAddress}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-on-surface">{item.weightGram} g</p>
                          <p className="text-xs text-primary font-bold">+{item.earnedPoints} pts</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                          {formatDate(item.submittedAt)}
                        </td>
                        <td className="px-5 py-4">
                          {item.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container/20 text-primary rounded-full text-xs font-bold">
                              <Icon name="check_circle" fill style={{ fontSize: 14 }} /> {t("admin.verification.statusApproved")}
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-error-container text-error rounded-full text-xs font-bold">
                                <Icon name="cancel" fill style={{ fontSize: 14 }} /> {t("admin.verification.statusRejected")}
                              </span>
                              {item.rejectionReason && (
                                <p className="text-xs text-on-surface-variant mt-1 max-w-[180px]">{item.rejectionReason}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Approve / Reject Modal ── */}
      {modalType && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className={`p-5 shrink-0 ${modalType === "approve" ? "bg-primary" : "bg-error"}`}>
              <div className="flex items-center gap-3">
                <Icon name={modalType === "approve" ? "check_circle" : "cancel"} fill className="text-white" style={{ fontSize: 26 }} />
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {modalType === "approve" ? t("admin.verification.modalApproveTitle") : t("admin.verification.modalRejectTitle")}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {selected.userName} · #{selected.id} · {formatDate(selected.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Summary */}
              <div className="p-3 bg-surface-container rounded-xl space-y-2">
                <InfoRow label={t("admin.verification.labelUser")} value={`${selected.userName} (${selected.userPhone})`} />
                <InfoRow label={t("admin.verification.labelCategory")} value={selected.aiCategory} />
                <InfoRow label="Lokasi" value={selected.locationName} />
                <InfoRow label={t("admin.verification.labelWeight")} value={`${selected.weightGram} gram`} />
                <InfoRow label={t("admin.verification.labelPoints")} value={`+${selected.earnedPoints} pts`} />
                <InfoRow label={t("admin.verification.labelConfidence")} value={`${selected.confidence}%`} />
              </div>

              {/* AI message */}
              {selected.aiMessage && (
                <div className="flex items-start gap-2 p-3 bg-secondary-container/20 rounded-xl">
                  <Icon name="smart_toy" fill className="text-secondary shrink-0 mt-0.5" style={{ fontSize: 16 }} />
                  <p className="text-xs text-on-surface-variant leading-relaxed">{selected.aiMessage}</p>
                </div>
              )}

              {/* Photo */}
              {selected.photoPath && (
                <div className="rounded-xl overflow-hidden border border-outline-variant">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE_URL}/storage/${selected.photoPath}`}
                    alt="Foto setoran"
                    className="w-full max-h-48 object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              {modalType === "approve" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-outline uppercase tracking-wide block mb-1">
                      Nama Produk / Sampah <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="cth: Botol Plastik Aqua 600ml"
                      className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wide block mb-1">
                        Kategori <span className="text-error">*</span>
                      </label>
                      {categories.length > 0 ? (
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Pilih kategori</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          placeholder="ID kategori"
                          className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-outline uppercase tracking-wide block mb-1">
                        Berat Aktual (gram) <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={weightGram}
                        onChange={(e) => setWeightGram(e.target.value)}
                        placeholder="gram"
                        className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant italic">
                    Poin akhir dihitung otomatis oleh server berdasarkan berat × rate konversi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-wide block">
                    {t("admin.verification.rejectReason")}
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("admin.verification.rejectReasonPlaceholder")}
                    className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-error resize-none"
                  />
                  <div className="flex items-start gap-2 p-3 bg-error-container rounded-xl">
                    <Icon name="warning" fill className="text-error shrink-0 mt-0.5" style={{ fontSize: 16 }} />
                    <p className="text-xs text-on-error-container">
                      Nasabah tidak mendapatkan poin. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3 justify-end shrink-0">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-5 py-2.5 border border-outline text-on-surface rounded-xl font-button text-sm hover:bg-surface-variant transition-colors disabled:opacity-60"
              >
                {t("admin.verification.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing || (modalType === "approve" && !canApprove)}
                className={`px-5 py-2.5 ${
                  modalType === "approve" ? "bg-primary text-on-primary" : "bg-error text-on-error"
                } rounded-xl font-button text-sm hover:brightness-95 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2`}
              >
                {processing ? (
                  <><Icon name="sync" className="animate-spin" style={{ fontSize: 16 }} /> Memproses…</>
                ) : modalType === "approve" ? (
                  <><Icon name="qr_code_2" style={{ fontSize: 16 }} /> {t("admin.verification.approveConfirm")}</>
                ) : (
                  <><Icon name="close" style={{ fontSize: 16 }} /> {t("admin.verification.rejectConfirm")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Code Modal ── */}
      {qrResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-primary p-5 text-center">
              <Icon name="qr_code_2" fill className="text-white" style={{ fontSize: 36 }} />
              <h3 className="font-bold text-white text-lg mt-1">{t("admin.verification.qrTitle")}</h3>
              <p className="text-white/80 text-xs mt-0.5">Tunjukkan kepada nasabah untuk dipindai</p>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-inner flex flex-col items-center gap-3">
                <QRCode value={qrResult.token} size={180} />
                <p className="font-mono text-xs text-on-surface-variant break-all text-center select-all px-1">
                  {qrResult.token}
                </p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between p-3 bg-primary-container/10 rounded-xl">
                  <span className="text-xs font-bold text-outline uppercase">{t("admin.verification.finalPoints")}</span>
                  <span className="font-bold text-primary text-lg">+{qrResult.points.toLocaleString("id-ID")} Pts</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                  <span className="text-xs font-bold text-outline uppercase">{t("admin.verification.labelId")}</span>
                  <span className="font-bold text-on-surface text-sm">#{qrResult.transactionId}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-tertiary-container/20 rounded-xl w-full">
                <Icon name="info" fill className="text-tertiary shrink-0 mt-0.5" style={{ fontSize: 16 }} />
                <p className="text-xs text-on-surface-variant">
                  QR Code hanya berlaku sekali. Nasabah pindai via menu <strong>Scan</strong> di aplikasi.
                </p>
              </div>
              <button
                onClick={() => setQrResult(null)}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-button text-sm hover:brightness-95 transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[100]">
          <div className={`${toast.type === "error" ? "bg-error-container border border-error/20" : "bg-on-background"} rounded-xl px-5 py-4 shadow-xl flex items-center gap-3`}>
            <Icon name={toast.type === "error" ? "error" : "check_circle"} fill
              className={toast.type === "error" ? "text-error" : "text-primary-fixed"} />
            <p className={`text-sm font-medium ${toast.type === "error" ? "text-error" : "text-surface"}`}>
              {toast.msg}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
