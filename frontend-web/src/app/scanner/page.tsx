"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import jsQR from "jsqr";
import Swal from "sweetalert2";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";
import { analyzeWaste, submitDeposit, scanQr, getLocations } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import type { ScanResult } from "@/lib/types";
import type { ScanQrResult } from "@/lib/api";

type Tab = "deposit" | "scanqr";
type Phase = "upload" | "analyzing" | "result" | "submitting" | "done";
type QrPhase = "scanning" | "success" | "error";

const DRAFT_KEY = "eco_scan_draft";

function saveDraft(result: ScanResult, preview: string | null) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ result, preview }));
  } catch { }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch { }
}

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function ScannerPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("deposit");

  // ── Deposit tab ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  // ── Scan QR tab ────────────────────────────────────────────────────────────
  const [qrPhase, setQrPhase] = useState<QrPhase>("scanning");
  const [qrResult, setQrResult] = useState<ScanQrResult | null>(null);
  const [qrErrorMsg, setQrErrorMsg] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrSubmitting, setQrSubmitting] = useState(false);
  const [qrScanMode, setQrScanMode] = useState<"camera" | "manual">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // flag to prevent duplicate token submissions while awaiting API
  const scanningRef = useRef(false);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  function stopCamera() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    scanningRef.current = false;
  }

  function startScanning() {
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // BarcodeDetector path (Chrome/Android — fast, native)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasBD = "BarcodeDetector" in window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = hasBD ? new (window as any).BarcodeDetector({ formats: ["qr_code"] }) : null;

    scanIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || scanningRef.current) return;
      try {
        let token: string | null = null;

        if (detector) {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) token = barcodes[0].rawValue as string;
        } else {
          // jsQR fallback — works on iOS Safari & Firefox
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code) token = code.data;
        }

        if (token) {
          scanningRef.current = true;
          clearInterval(scanIntervalRef.current!);
          scanIntervalRef.current = null;
          handleQrToken(token);
        }
      } catch { /* frame decode error — ignore */ }
    }, 250);
  }

  async function startCamera() {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Kamera tidak tersedia. Pastikan akses via HTTPS.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      startScanning();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCameraError(msg);
    }
  }

  useEffect(() => {
    if (activeTab !== "scanqr" || qrPhase !== "scanning" || qrScanMode !== "camera") {
      stopCamera();
      return;
    }
    startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, qrScanMode, qrPhase]);

  async function handleQrToken(token: string) {
    if (!token.trim()) return;
    setQrSubmitting(true);
    try {
      const res = await scanQr(token.trim());
      stopCamera();
      setQrResult(res);
      setQrPhase("success");
    } catch (e) {
      stopCamera();
      setQrErrorMsg(e instanceof Error ? e.message : "Scan gagal");
      setQrPhase("error");
    } finally {
      setQrSubmitting(false);
    }
  }

  function resetQr() {
    setQrPhase("scanning");
    setQrResult(null);
    setQrErrorMsg("");
    setQrToken("");
    setQrScanMode("camera");
  }

  // ── Deposit helpers ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const { result: r, preview: p } = JSON.parse(raw) as {
          result: ScanResult;
          preview: string | null;
        };
        setResult(r);
        setPreview(p);
        setPhase("result");
      }
    } catch { }
  }, []);

  async function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setPhase("analyzing");
    try {
      const compressedFile = await compressImage(file);
      const r = await analyzeWaste(compressedFile);
      setResult(r);
      setPhase("result");
      saveDraft(r, null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Analisis AI gagal", "error");
      setPhase("upload");
    }
  }

  useEffect(() => {
    if (result && phase === "result") {
      saveDraft(result, preview);
    }
  }, [result, preview, phase]);

  function reset() {
    setPhase("upload");
    setPreview(null);
    setResult(null);
    clearDraft();
  }

  async function handleSubmit() {
    if (!result) return;
    setPhase("submitting");
    try {
      const { selectedLocation } = await getLocations();
      if (!selectedLocation) {
        setPhase("result");
        Swal.fire({
          icon: "warning",
          title: "Lokasi Belum Dipilih",
          text: "Silahkan pilih lokasi terlebih dahulu.",
          confirmButtonText: "Pilih Lokasi",
          confirmButtonColor: "#006d37"
        }).then(() => {
          router.push("/locations");
        });
        return;
      }

      await submitDeposit({
        productName: result.productName,
        category: result.category,
        weightGrams: result.estimatedWeight ?? 0,
        locationId: result.locationId ?? selectedLocation.id,
        categoryId: result.categoryId,
        confidence: result.confidence,
        message: result.message,
        imagePath: result.imagePath,
      });
      clearDraft();
      setPhase("done");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Pengiriman setoran gagal", "error");
      setPhase("result");
    }
  }

  const points = result?.estimatedPoint ?? 0;

  return (
    <AppShell>
      {toast && <Toast {...toast} />}
      <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-4 md:py-stack-lg">

        {/* Header + tabs */}
        <div className="mb-5">
          <h1 className="text-xl md:text-headline-lg font-headline-lg text-on-background mb-3">
            {activeTab === "deposit" ? t("scanner.titleDeposit") : t("scanner.titleScanQr")}
          </h1>
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
            {(["deposit", "scanqr"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {tab === "deposit" ? t("scanner.tabDeposit") : t("scanner.tabScanQr")}
              </button>
            ))}
          </div>
        </div>

        {/* ── DEPOSIT TAB ────────────────────────────────────────── */}
        {activeTab === "deposit" && (
          <>
            <p className="hidden md:block text-body-lg text-on-surface-variant max-w-2xl mb-6">
              {t("scanner.depositSubtitle")}
            </p>

            {phase === "upload" && (
              <label
                className="flex flex-col items-center justify-center min-h-[260px] md:min-h-[400px] rounded-xl p-stack-lg cursor-pointer transition-all hover:bg-primary-container/5"
                style={{
                  border: "2px dashed #6c7b6d",
                  backgroundImage: "radial-gradient(#bbcbbb 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFile(e.target.files[0])
                  }
                />
                <div className="text-center">
                  <Icon name="cloud_upload" className="text-primary mb-4" style={{ fontSize: 64 }} />
                  <h2 className="text-headline-md font-headline-md mb-2">
                    {t("scanner.uploadTitle")}
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    {t("scanner.uploadSubtitle")}
                  </p>
                </div>
              </label>
            )}

            {(phase === "analyzing" || phase === "result" || phase === "submitting") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
                <div className="flex flex-col gap-4">
                  <div
                    className="rounded-lg overflow-hidden aspect-square bg-surface-container-low flex items-center justify-center relative"
                    style={{ border: "2px solid #006d37", padding: 8, background: "rgba(0,109,55,0.03)" }}
                  >
                    {phase === "analyzing" && <div className="scan-line" />}
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Preview sampah"
                        className={`w-full h-full object-cover transition-opacity duration-700 ${
                          phase === "analyzing" ? "opacity-30" : "opacity-100"
                        }`}
                      />
                    ) : (
                      <Icon name="image" className="text-outline" style={{ fontSize: 64 }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm">
                    <Icon name={phase === "analyzing" ? "sync" : "check_circle"} fill />
                    {phase === "analyzing" ? t("scanner.analyzing") : t("scanner.analyzed")}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-4 bg-white rounded-xl shadow-sm border border-surface-variant min-h-[320px]">
                  {phase === "analyzing" ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                      <div className="w-20 h-20 rounded-full bg-primary-container/30 flex items-center justify-center">
                        <Icon name="manage_search" className="text-primary animate-pulse" style={{ fontSize: 40 }} />
                      </div>
                      <p className="text-primary font-bold text-lg text-center">{t("scanner.scanningTitle")}</p>
                      <p className="text-on-surface-variant text-sm text-center max-w-xs">{t("scanner.scanningDesc")}</p>
                      <div className="flex gap-1 mt-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      {result && (
                        <div className="space-y-stack-md">
                          <FieldRow label={t("scanner.fieldSubmitter")}>
                            <input
                              readOnly
                              value={user?.fullName ?? ""}
                              className="w-full p-3 rounded-lg border border-surface-variant bg-surface-container-low outline-none cursor-not-allowed"
                            />
                          </FieldRow>
                          <FieldRow label={t("scanner.fieldProduct")}>
                            <input
                              readOnly
                              value={result.productName}
                              className="w-full p-3 rounded-lg border border-surface-variant bg-surface-container-low outline-none cursor-not-allowed"
                            />
                          </FieldRow>
                          <FieldRow label={t("scanner.fieldCategory")}>
                            <div className="flex flex-wrap gap-2">
                              {result.tags.map((tag, i) => (
                                <span
                                  key={tag}
                                  className={`px-3 py-1 rounded-full text-label-sm font-label-sm border ${
                                    i === 0
                                      ? "bg-primary-container text-on-primary-container border-primary/20"
                                      : i === 1
                                      ? "bg-secondary-container text-on-secondary-container border-secondary/20"
                                      : "bg-tertiary-container text-on-tertiary-container border-tertiary/20"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </FieldRow>
                          <FieldRow label={t("scanner.fieldWeight")}>
                            <input
                              readOnly
                              value={result.estimatedWeight ?? 0}
                              className="w-full p-3 rounded-lg border border-surface-variant bg-surface-container-low outline-none cursor-not-allowed"
                            />
                          </FieldRow>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-stack-sm">
                              <label className="text-label-sm font-label-sm text-outline">{t("scanner.fieldPoints")}</label>
                              <div className="p-3 bg-surface-container-low rounded-lg font-bold text-primary flex items-center gap-2">
                                <Icon name="eco" /> {points} Poin
                              </div>
                            </div>
                            <div className="space-y-stack-sm">
                              <label className="text-label-sm font-label-sm text-outline">{t("scanner.fieldConfidence")}</label>
                              <div className="p-3 bg-surface-container-low rounded-lg font-bold text-secondary flex items-center gap-2">
                                <Icon name="analytics" /> {result.confidence}%
                              </div>
                            </div>
                          </div>
                          <p className="text-label-sm font-label-sm text-outline">{t("scanner.pointRate")}</p>
                        </div>
                      )}
                      <div className="mt-stack-lg flex justify-end gap-4">
                        <button
                          onClick={reset}
                          className="px-6 py-3 border border-outline text-on-surface font-button text-button rounded-xl hover:bg-surface-variant transition-colors"
                        >
                          {t("scanner.retakePhoto")}
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={phase === "submitting"}
                          className="px-6 py-3 bg-primary text-on-primary font-button text-button rounded-xl hover:brightness-95 shadow-lg flex items-center gap-2 group transition-all active:scale-95 disabled:opacity-60"
                        >
                          {phase === "submitting" ? t("scanner.submitting") : t("scanner.submit")}
                          <Icon name="send" className="transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                  <Icon name="check_circle" fill style={{ fontSize: 48 }} />
                </div>
                <h2 className="text-headline-md font-headline-md text-primary">{t("scanner.doneTitle")}</h2>
                <p className="text-body-md text-on-surface-variant max-w-md">
                  {t("scanner.doneDesc")}
                </p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={reset}
                    className="px-6 py-3 border border-outline text-on-surface font-button rounded-xl hover:bg-surface-variant transition-colors"
                  >
                    {t("scanner.depositAgain")}
                  </button>
                  <button
                    onClick={() => router.push("/history")}
                    className="px-6 py-3 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 transition-all"
                  >
                    {t("scanner.viewHistory")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SCAN QR TAB ────────────────────────────────────────── */}
        {activeTab === "scanqr" && (
          <>
            {qrPhase === "success" && qrResult && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                  <Icon name="check_circle" fill style={{ fontSize: 48 }} />
                </div>
                <h2 className="text-headline-md font-headline-md text-primary">{t("scanner.qrSuccessTitle")}</h2>
                <p className="text-body-md text-on-surface-variant max-w-md">{qrResult.message}</p>
                <div className="flex gap-4 mt-2">
                  <div className="text-center p-5 bg-primary-container rounded-2xl min-w-[120px]">
                    <p className="text-3xl font-bold text-on-primary-container">+{qrResult.pointsEarned}</p>
                    <p className="text-xs text-on-primary-container/70 font-semibold mt-1">{t("scanner.qrPointsEarned")}</p>
                  </div>
                  <div className="text-center p-5 bg-surface-container rounded-2xl min-w-[120px]">
                    <p className="text-3xl font-bold text-on-surface">{qrResult.totalPoints}</p>
                    <p className="text-xs text-on-surface-variant font-semibold mt-1">{t("scanner.qrTotalPoints")}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={resetQr}
                    className="px-6 py-3 border border-outline text-on-surface font-button rounded-xl hover:bg-surface-variant transition-colors"
                  >
                    {t("scanner.qrScanAgain")}
                  </button>
                  <button
                    onClick={() => router.push("/history")}
                    className="px-6 py-3 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 transition-all"
                  >
                    {t("scanner.viewHistory")}
                  </button>
                </div>
              </div>
            )}

            {qrPhase === "error" && (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
                  <Icon name="error" fill style={{ fontSize: 48 }} />
                </div>
                <h2 className="text-headline-md font-headline-md text-error">{t("scanner.qrErrorTitle")}</h2>
                <p className="text-body-md text-on-surface-variant max-w-md">{qrErrorMsg}</p>
                <button
                  onClick={resetQr}
                  className="mt-4 px-6 py-3 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 transition-all"
                >
                  {t("scanner.qrRetry")}
                </button>
              </div>
            )}

            {qrPhase === "scanning" && (
              <div className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
                <p className="hidden md:block text-body-md text-on-surface-variant text-center">
                  {t("scanner.qrSubtitle")}
                </p>

                {qrScanMode === "camera" && (
                  <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-square shadow-xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Corner markers */}
                    {!cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-52 h-52 relative">
                          <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                          <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                        </div>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <Icon name="videocam_off" className="text-white/60" style={{ fontSize: 48 }} />
                        <p className="text-white text-sm font-medium">{cameraError}</p>
                      </div>
                    )}
                    {qrSubmitting && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Icon name="sync" className="text-white animate-spin" style={{ fontSize: 48 }} />
                      </div>
                    )}
                    {!cameraError && (
                      <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium drop-shadow">
                        {t("scanner.qrAim")}
                      </p>
                    )}
                  </div>
                )}

                {qrScanMode === "manual" && (
                  <div className="w-full space-y-4">
                    <div className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low">
                      <Icon name="qr_code_scanner" style={{ fontSize: 64 }} className="text-on-surface-variant" />
                      <p className="text-body-md text-on-surface-variant text-center">
                        {t("scanner.qrManualDesc")}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQrToken(qrToken)}
                      placeholder={t("scanner.qrPlaceholder")}
                      className="w-full p-4 rounded-xl border border-outline bg-surface font-mono text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => handleQrToken(qrToken)}
                      disabled={!qrToken.trim() || qrSubmitting}
                      className="w-full py-3 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
                    >
                      {qrSubmitting ? (
                        <Icon name="sync" className="animate-spin" style={{ fontSize: 20 }} />
                      ) : (
                        <Icon name="check_circle" style={{ fontSize: 20 }} />
                      )}
                      {qrSubmitting ? t("scanner.qrProcessing") : t("scanner.qrVerify")}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setQrScanMode(qrScanMode === "camera" ? "manual" : "camera")}
                  className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  <Icon
                    name={qrScanMode === "camera" ? "keyboard" : "qr_code_scanner"}
                    style={{ fontSize: 18 }}
                  />
                  {qrScanMode === "camera" ? t("scanner.qrSwitchManual") : t("scanner.qrSwitchCamera")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-stack-sm">
      <label className="text-label-sm font-label-sm text-outline">{label}</label>
      {children}
    </div>
  );
}
