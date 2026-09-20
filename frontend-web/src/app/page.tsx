"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

const PILLARS = [
  {
    icon: "fact_check",
    title: "Validasi Sampah",
    desc: "Memastikan setiap setoran diverifikasi akurat melalui teknologi pemantauan IoT dan AI.",
  },
  {
    icon: "token",
    title: "Distribusi Rewards",
    desc: "Mengonversi setiap tindakan berkelanjutan menjadi aset digital dan reward eksklusif secara instan.",
  },
  {
    icon: "school",
    title: "Edukasi Berkelanjutan",
    desc: "Memberdayakan komunitas dengan pengetahuan praktis tentang ekonomi sirkular dan gaya hidup minim sampah.",
  },
  {
    icon: "bar_chart_4_bars",
    title: "Transparansi Dampak",
    desc: "Menyediakan data real-time serta pengelolaan limbah secara terbuka dan jujur.",
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const dashboardHref = user?.role === "admin" ? "/admin/verification" : "/dashboard";
  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto h-20">
          <Link href="/" className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <img src="/logo.svg" alt="Smart Eco Bank" className="w-8 h-8 rounded-lg object-cover" />
            Smart Eco Bank
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-full font-button hover:brightness-95 transition-all active:scale-95"
              >
                <Icon name="dashboard" fill style={{ fontSize: 16 }} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-button"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full font-button hover:brightness-95 transition-all active:scale-95"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-20 flex-grow">
        {/* Hero */}
        <section className="relative h-[70vh] flex items-center overflow-hidden eco-gradient">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute -right-20 -bottom-20 opacity-10">
            <Icon name="eco" fill style={{ fontSize: 480 }} />
          </div>
          <div className="relative z-10 px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full">
            <div className="max-w-2xl text-white">
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-[56px] md:leading-[64px] mb-6">
                Membangun Masa Depan Hijau
              </h1>
              <p className="font-body-lg text-body-lg opacity-90 leading-relaxed">
                Smart Eco Bank menggabungkan inovasi teknologi finansial dengan
                komitmen lingkungan yang mendalam. Setiap transaksi finansial
                dapat menjadi katalisator bagi pemulihan ekologi global.
              </p>
              <div className="flex items-center gap-4 mt-8">
                {user ? (
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-full font-button hover:bg-surface-container-low transition-all active:scale-95 shadow-lg"
                  >
                    <Icon name="dashboard" fill style={{ fontSize: 18 }} />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="bg-white text-primary px-8 py-3 rounded-full font-button hover:bg-surface-container-low transition-all active:scale-95 shadow-lg"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="border border-white/60 text-white px-8 py-3 rounded-full font-button hover:bg-white/10 transition-all"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-24 px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary font-label-sm text-label-sm uppercase tracking-widest mb-4 block">
                Visi Kami
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6">
                Pengenalan Kami
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Kami adalah bank digital yang berdedikasi memberikan penghargaan
                atas setiap tindakan berkelanjutan Anda. Kami tidak hanya
                mengelola aset keuangan, tetapi membantu Anda membangun warisan
                lingkungan positif bagi generasi mendatang melalui ekosistem
                ekonomi sirkular yang terintegrasi.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden eco-gradient flex items-center justify-center">
                <Icon name="recycling" fill className="text-white/80" style={{ fontSize: 160 }} />
              </div>
              <div className="absolute -bottom-8 -left-8 glass-card p-8 rounded-xl max-w-xs shadow-xl">
                <div className="flex items-center gap-4 mb-2">
                  <Icon name="eco" className="text-primary text-4xl" />
                  <span className="font-headline-md text-headline-md text-primary">100%</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                  Komitmen Berkelanjutan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-24 bg-surface-container-low">
          <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4">
                {t("about.pillarTitle")}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                Pilar utama operasional kami untuk memastikan transparansi dan
                dampak nyata bagi lingkungan dan masyarakat.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="bg-surface rounded-2xl p-8 border border-outline-variant hover:border-primary-container transition-all group"
                >
                  <div className="w-14 h-14 bg-primary-container/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-container/20 transition-colors">
                    <Icon name={p.icon} className="text-primary text-3xl" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-4">{p.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto text-center">
          <div className="bg-primary rounded-[32px] p-10 md:p-16 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Icon name="forest" fill style={{ fontSize: 240 }} />
            </div>
            <div className="relative z-10">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6">
                Mulai Perjalanan Hijau Anda Hari Ini
              </h2>
              <p className="font-body-lg text-body-lg opacity-90 mb-10 max-w-2xl mx-auto">
                Bergabunglah dengan ribuan orang lain yang telah mengubah limbah
                menjadi peluang dan membantu memulihkan bumi kita.
              </p>
              {user ? (
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 bg-white text-primary px-10 py-4 rounded-full font-button text-lg hover:bg-surface-container-low transition-all active:scale-95 shadow-lg"
                >
                  <Icon name="dashboard" fill style={{ fontSize: 20 }} />
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-block bg-white text-primary px-10 py-4 rounded-full font-button text-lg hover:bg-surface-container-low transition-all active:scale-95 shadow-lg"
                >
                  Buka Smart Eco Bank Sekarang
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-stack-lg px-container-padding-mobile md:px-container-padding-desktop border-t border-outline-variant bg-surface-container-highest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface font-bold">
            <img src="/logo.svg" alt="Smart Eco Bank" className="w-8 h-8 rounded-lg object-cover" />
            Smart Eco Bank
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            © 2026 Smart Eco Bank. Empowering a Circular Economy.
          </p>
          <div className="flex gap-6">
            {["language", "public", "share"].map((i) => (
              <Icon key={i} name={i} className="text-on-surface-variant hover:text-primary cursor-pointer" />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
