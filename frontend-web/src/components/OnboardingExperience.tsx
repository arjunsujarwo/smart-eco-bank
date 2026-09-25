"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";

const ONBOARDING_KEY = "smart-eco-bank:onboarding-complete";

const STEPS = [
  {
    eyebrow: "01 · Setorkan",
    title: "Ubah barang bekas jadi dampak nyata",
    description:
      "Mulai dari satu botol atau kardus. Gunakan scanner untuk mencatat setoran dan melihat nilainya dalam hitungan detik.",
    icon: "recycling",
    color: "from-emerald-500 to-teal-500",
  },
  {
    eyebrow: "02 · Pantau",
    title: "Semua progres ada di satu tempat",
    description:
      "Dashboard membantu Anda memantau poin, riwayat setoran, dan jejak dampak lingkungan secara transparan.",
    icon: "monitoring",
    color: "from-sky-500 to-indigo-500",
  },
  {
    eyebrow: "03 · Tumbuh bersama",
    title: "Tukarkan poin, rawat bumi",
    description:
      "Kumpulkan poin dari kebiasaan baik dan tukarkan dengan reward pilihan Anda. Setiap langkah kecil berarti.",
    icon: "eco",
    color: "from-lime-500 to-emerald-600",
  },
];

export default function OnboardingExperience() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Keep the experience out of admin and authentication flows.
  const isAppRoute = pathname === "/" || pathname === "/dashboard";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const completed = window.localStorage.getItem(ONBOARDING_KEY) === "1";
      setReady(true);
      setSplashVisible(false);
      if (!completed && (pathname === "/" || pathname === "/dashboard")) {
        setOpen(true);
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function finish() {
    window.localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
  }

  function replay() {
    setStep(0);
    setOpen(true);
  }

  if (!isAppRoute || !ready) {
    return splashVisible && isAppRoute ? <SplashScreen /> : null;
  }

  const current = STEPS[step];

  return (
    <>
      {splashVisible && <SplashScreen />}
      {!open && (
        <button
          type="button"
          onClick={replay}
          aria-label="Buka panduan Smart Eco Bank"
          className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
        >
          <Icon name="auto_stories" style={{ fontSize: 20 }} />
          Panduan
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className={`h-2 bg-gradient-to-r ${current.color}`} />
            <button
              type="button"
              onClick={finish}
              aria-label="Tutup panduan"
              className="absolute right-5 top-5 z-10 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <Icon name="close" style={{ fontSize: 22 }} />
            </button>
            <div className="grid md:grid-cols-[0.85fr_1.15fr]">
              <div className={`relative flex min-h-56 items-center justify-center overflow-hidden bg-gradient-to-br ${current.color} p-8 text-white md:min-h-[390px]`}>
                <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-black/10" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-inner ring-1 ring-white/30">
                    <Icon name={current.icon} fill style={{ fontSize: 54 }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                    Smart Eco Bank
                  </span>
                  <div className="mt-6 flex gap-2" aria-label={`Langkah ${step + 1} dari ${STEPS.length}`}>
                    {STEPS.map((item, index) => (
                      <span key={item.eyebrow} className={`h-1.5 rounded-full transition-all ${index === step ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between p-7 sm:p-10">
                <div>
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">
                    {current.eyebrow}
                  </p>
                  <h2 id="onboarding-title" className="max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
                    {current.title}
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                    {current.description}
                  </p>
                </div>
                <div className="mt-9 flex items-center justify-between gap-4">
                  <button type="button" onClick={finish} className="text-sm font-bold text-slate-500 transition hover:text-slate-900">
                    Lewati
                  </button>
                  <button
                    type="button"
                    onClick={() => (step === STEPS.length - 1 ? finish() : setStep((value) => value + 1))}
                    className="flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  >
                    {step === STEPS.length - 1 ? "Mulai sekarang" : "Lanjut"}
                    <Icon name={step === STEPS.length - 1 ? "check" : "arrow_forward"} style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#062e20] text-white" aria-label="Memuat Smart Eco Bank">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
      <div className="relative flex flex-col items-center">
        <div className="flex h-24 w-24 animate-pulse items-center justify-center rounded-[2rem] bg-emerald-400/15 ring-1 ring-emerald-200/20">
          <img src="/logo.svg" alt="" className="h-16 w-16 rounded-2xl" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Smart Eco Bank</h1>
        <p className="mt-2 text-sm text-emerald-100/70">Membangun kebiasaan baik, bersama.</p>
        <div className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/2 animate-[loading_1.1s_ease-in-out_infinite] rounded-full bg-emerald-300" />
        </div>
      </div>
    </div>
  );
}
