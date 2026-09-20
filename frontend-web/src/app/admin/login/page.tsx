"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { adminLogin, adminLogout, getAdminProfile } from "@/lib/adminApi";
import PinVerificationModal from "@/components/PinVerificationModal";
import { useTranslation } from "react-i18next";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("admin_prefill");
    if (raw) {
      try {
        const { email: e, password: p } = JSON.parse(raw) as { email: string; password: string };
        if (e) setEmail(e);
        if (p) setPassword(p);
      } catch {}
      sessionStorage.removeItem("admin_prefill");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await adminLogin(email, password);
      if (ok) {
        // Fetch profile to check if has PIN
        const profile = await getAdminProfile();
        if (profile.hasPin) {
          setShowPinModal(true);
          setLoading(false);
        } else {
          router.push("/admin/verification");
        }
      } else {
        setError(t("admin.login.error"));
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t("admin.login.error"));
      setLoading(false);
    }
  }

  function handlePinSuccess() {
    setShowPinModal(false);
    router.push("/admin/verification");
  }

  function handlePinClose() {
    // If they cancel PIN, logout and stay on login page
    adminLogout();
    setShowPinModal(false);
    setError(t("admin.login.pinCancelled"));
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-outline hover:text-primary transition-colors mb-4 w-fit"
          >
            <Icon name="arrow_back" style={{ fontSize: 16 }} />
            {t("admin.login.backToHome")}
          </Link>
          {/* Brand header */}
          <div className="eco-gradient rounded-t-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-md">
              <img src="/logo.svg" alt="Smart Eco Bank" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-headline-md font-headline-md text-white font-bold">Smart Eco Bank</h1>
            <p className="text-white/80 text-label-sm font-label-sm uppercase tracking-widest mt-1">
              {t("admin.login.portal")}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-b-2xl p-8 space-y-6 border border-outline-variant border-t-0 shadow-lg"
          >
            <div className="space-y-2">
              <label className="text-label-sm font-label-sm text-outline">{t("admin.login.emailLabel")}</label>
              <div className="relative">
                <Icon name="email" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smarteco.bank"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label-sm font-label-sm text-outline">{t("admin.login.passwordLabel")}</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-surface border border-outline-variant rounded-xl text-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                >
                  <Icon name={showPass ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container rounded-xl text-error text-body-md">
                <Icon name="error" fill className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary font-button rounded-xl hover:brightness-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Icon name="sync" className="animate-spin" />
                  {t("admin.login.loading")}
                </>
              ) : (
                <>
                  <Icon name="login" />
                  {t("admin.login.submit")}
                </>
              )}
            </button>

            <p className="text-center text-label-sm font-label-sm text-outline">
              {t("admin.login.restricted")}
            </p>
          </form>

          {/* Demo hint */}
          <p className="text-center text-[11px] text-outline mt-4">
            Demo: admin@smarteco.bank / admin123
          </p>
        </div>
      </div>

      <PinVerificationModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        isAdmin={true}
      />
    </>
  );
}
