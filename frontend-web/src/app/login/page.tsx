"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

type Phase = "idle" | "loading" | "redirecting";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("account_suspended") === "1") {
      setSuspended(true);
      sessionStorage.removeItem("account_suspended");
    }
  }, []);

  async function handleSubmit() {
    if (!email || !password || phase !== "idle") return;
    setError("");
    setPhase("loading");
    try {
      const user = await login(email, password);
      if (!user) {
        setPhase("idle");
        if (sessionStorage.getItem("account_suspended") === "1") {
          sessionStorage.removeItem("account_suspended");
          setSuspended(true);
        } else {
          setError(t("login.errorInvalid"));
        }
        return;
      }
      setPhase("redirecting");
      if (user.role === "admin") {
        // Clear user-side session — admin must authenticate via admin portal
        await logout();
        sessionStorage.setItem("admin_prefill", JSON.stringify({ email, password }));
        router.push("/admin/login");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setPhase("idle");
      setError(e instanceof Error ? e.message : t("login.errorInvalid"));
    }
  }

  function handleAdminLogin() {
    sessionStorage.setItem("admin_prefill", JSON.stringify({ email, password }));
    router.push("/admin/login");
  }

  const busy = phase !== "idle";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-surface border-b border-surface-variant">
        <div className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-[1280px] mx-auto">
          <Link href="/" className="flex items-center gap-2 text-headline-md font-headline-md font-bold text-primary">
            <img src="/logo.svg" alt="Smart Eco Bank" className="w-8 h-8 rounded-lg object-cover" />
            Smart Eco Bank
          </Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row max-w-[1280px] mx-auto w-full px-container-padding-mobile md:px-container-padding-desktop py-stack-lg gap-gutter items-center">
        {/* Left banner */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-stack-lg relative">
          <div className="space-y-stack-md relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary/20 rounded-full">
              <Icon name="auto_awesome" fill className="text-primary text-sm" />
              <span className="text-label-sm font-label-sm text-on-primary-container">
                {t("login.tagline")}
              </span>
            </div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg leading-tight">
              {t("login.hero")} <span className="text-primary italic">{t("login.heroPoints")}</span>{" "}
              &amp; <span className="text-primary">{t("login.heroAsset")}</span>
            </h1>
            <p className="text-body-lg font-body-lg text-on-surface-variant max-w-lg">
              {t("login.heroDesc")}
            </p>
          </div>
          <div className="flex items-center gap-stack-md pt-stack-md">
            <div className="flex -space-x-3">
              {["#2ecc71", "#485c97", "#735c00"].map((c, i) => (
                <span
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-surface flex items-center justify-center text-white"
                  style={{ backgroundColor: c }}
                >
                  <Icon name="person" fill className="text-lg" />
                </span>
              ))}
            </div>
            <div className="text-body-md font-body-md text-on-surface-variant">
              <span className="font-bold text-on-surface">12k+</span> {t("login.activeUsers")}
            </div>
          </div>
          <div className="hidden md:block floating-eco w-32 h-32 absolute right-0 top-0 opacity-20 pointer-events-none">
            <Icon name="recycling" fill className="text-primary" style={{ fontSize: 120 }} />
          </div>
        </div>

        {/* Right: login form */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="glass-card w-full max-w-md p-stack-lg rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] relative overflow-hidden">

            {/* Suspension alert */}
            {suspended && (
              <div className="mb-stack-md flex items-start gap-3 bg-error-container/20 border border-error/40 rounded-lg p-4">
                <Icon name="gpp_bad" fill className="text-error shrink-0 mt-0.5" style={{ fontSize: 20 }} />
                <div>
                  <p className="font-bold text-error text-label-sm">{t("login.suspendedTitle")}</p>
                  <p className="text-error/80 text-label-sm mt-0.5">{t("login.suspendedDesc")}</p>
                </div>
                <button
                  onClick={() => setSuspended(false)}
                  className="ml-auto shrink-0 text-error/60 hover:text-error transition-colors"
                >
                  <Icon name="close" style={{ fontSize: 16 }} />
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {busy && (
              <div className="absolute inset-0 z-10 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center">
                  <Icon name="manage_accounts" className="text-primary animate-pulse" style={{ fontSize: 32 }} />
                </div>
                <p className="font-bold text-primary text-base text-center">
                  {phase === "redirecting" ? t("login.phaseRedirecting") : t("login.phaseValidating")}
                </p>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-stack-lg">
              <div className="space-y-1">
                <h2 className="text-headline-md font-headline-md">{t("login.formTitle")}</h2>
                <p className="text-body-md font-body-md text-on-surface-variant">{t("login.formSubtitle")}</p>
              </div>
              <div className="p-2 bg-secondary-container/20 rounded-lg">
                <Icon name="login" fill className="text-secondary" />
              </div>
            </div>

            <div className="space-y-stack-md">
              <div className="space-y-2">
                <label className="text-label-sm font-label-sm text-outline block">{t("login.emailLabel")}</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none disabled:opacity-50"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label-sm font-label-sm text-outline block">{t("login.passwordLabel")}</label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    disabled={busy}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <p className="text-error text-label-sm font-label-sm">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={busy}
                className="w-full py-4 eco-gradient text-white font-button rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {t("login.loginBtn")}
                <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleAdminLogin}
                disabled={busy}
                className="w-full py-3 border border-outline-variant text-on-surface-variant font-button rounded-lg hover:bg-surface-container-low hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Icon name="admin_panel_settings" fill style={{ fontSize: 16 }} />
                {t("login.adminLogin")}
              </button>

              <p className="text-center text-body-md font-body-md text-on-surface-variant pt-2">
                {t("login.registerPrompt")}{" "}
                <Link href="/register" className="text-primary font-bold">
                  {t("login.registerLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 border-t border-surface-variant text-center">
        <p className="text-label-sm font-label-sm text-outline">
          © 2026 Smart Eco Bank. Mengubah limbah menjadi masa depan yang berkelanjutan.
        </p>
      </footer>
    </div>
  );
}
