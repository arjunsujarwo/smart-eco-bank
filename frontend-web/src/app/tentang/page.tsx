"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import AppShell from "@/components/AppShell";
import Icon from "@/components/ui/Icon";

const FAQS = [
  {
    q: "Apa itu Smart Eco Bank?",
    a: "Smart Eco Bank adalah platform bank digital yang memberikan penghargaan atas tindakan daur ulang. Anda menyetor sampah terpilah, kami konversi menjadi poin, dan Anda tukarkan dengan reward eksklusif.",
  },
  {
    q: "Jenis sampah apa saja yang diterima?",
    a: "Kami menerima plastik (PET, HDPE, PP), kertas & kardus, logam (kaleng aluminium, besi), botol kaca, dan sampah elektronik (e-waste). Sampah harus bersih dan kering untuk mendapatkan poin optimal.",
  },
  {
    q: "Berapa lama proses verifikasi setoran?",
    a: "Admin kami memverifikasi setoran dalam 1×24 jam di hari kerja. Setelah diverifikasi, poin otomatis masuk ke saldo Anda dan notifikasi dikirim.",
  },
  {
    q: "Bagaimana cara menukarkan poin dengan reward?",
    a: 'Masuk ke menu Rewards, pilih produk yang Anda inginkan, tentukan jumlah, lalu klik "Tukarkan Poin". Reward akan dikirim ke alamat yang terdaftar dalam 3–5 hari kerja.',
  },
  {
    q: "Apakah poin memiliki masa berlaku?",
    a: "Poin berlaku selama 12 bulan sejak tanggal perolehan. Poin yang tidak digunakan akan kedaluwarsa secara otomatis. Kami akan mengirimkan pengingat 30 hari sebelum kedaluwarsa.",
  },
  {
    q: "Bagaimana cara melacak status pengiriman reward?",
    a: 'Setelah menukarkan reward, Anda bisa melihat status pengiriman di detail transaksi pada menu Rewards. Status akan diperbarui dari "Diproses" → "Dikirim" → "Terkirim".',
  },
  {
    q: "Apa yang harus dilakukan jika setoran ditolak?",
    a: "Jika setoran ditolak, Anda akan menerima notifikasi beserta alasannya. Biasanya karena foto kurang jelas atau sampah tidak memenuhi standar kebersihan. Anda bisa mengajukan setoran ulang.",
  },
];

export default function TentangPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const STEPS = [
    {
      num: "01",
      icon: "person_add",
      title: "Daftar Akun",
      desc: "Buat akun Smart Eco Bank dengan email, nomor HP, dan alamat Anda. Proses registrasi selesai dalam 2 menit.",
    },
    {
      num: "02",
      icon: "delete",
      title: "Kumpulkan Sampah",
      desc: "Pisahkan sampah Anda berdasarkan kategori: plastik, kertas, logam, dan elektronik. Semakin bersih, semakin tinggi nilainya.",
    },
    {
      num: "03",
      icon: "document_scanner",
      title: "Scan & Setor",
      desc: 'Buka menu "Setor", foto sampah Anda — AI kami akan mendeteksi jenis dan nilai sampah secara otomatis.',
    },
    {
      num: "04",
      icon: "eco",
      title: "Dapatkan Poin",
      desc: "Setelah admin memverifikasi setoran Anda, poin langsung masuk ke saldo. 1.000 gram = 2 poin.",
    },
    {
      num: "05",
      icon: "redeem",
      title: "Tukar Reward",
      desc: "Gunakan poin untuk menukarkan produk ramah lingkungan pilihan dari katalog Reward kami.",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-[1280px] mx-auto px-container-padding-mobile md:px-container-padding-desktop py-stack-lg space-y-12">

        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-stack-lg font-button"
          >
            <Icon name="arrow_back" />
            {t("tentang.backBtn")}
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
              <Icon name="info" fill style={{ fontSize: 28 }} />
            </div>
            <div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface mb-2">
                {t("tentang.title")}
              </h1>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Panduan lengkap penggunaan aplikasi dan jawaban atas pertanyaan
                yang sering diajukan.
              </p>
            </div>
          </div>
        </div>

        {/* App version badge */}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: "verified", label: "v1.0.0" },
            { icon: "language", label: "Bahasa Indonesia" },
            { icon: "eco", label: "Eco-Certified Platform" },
          ].map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-container/20 border border-primary/20 rounded-full text-primary font-label-sm text-label-sm"
            >
              <Icon name={b.icon} fill className="text-sm" />
              {b.label}
            </span>
          ))}
        </div>

        {/* ── Petunjuk Penggunaan ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <Icon name="menu_book" fill />
            </div>
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">
                {t("tentang.howItWorks")}
              </h2>
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                5 LANGKAH MUDAH
              </p>
            </div>
          </div>

          <div className="relative">
            {/* vertical connector line */}
            <div className="absolute left-[28px] top-10 bottom-10 w-px bg-outline-variant hidden md:block" />

            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="flex gap-5 items-start bg-surface border border-outline-variant rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  {/* Step number circle */}
                  <div className="shrink-0 w-14 h-14 rounded-full bg-primary-container/20 border-2 border-primary/20 flex flex-col items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary transition-all text-primary">
                    <span className="text-label-sm font-label-sm leading-none opacity-70">
                      {step.num}
                    </span>
                    <Icon name={step.icon} fill className="text-lg mt-0.5" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-body-md font-bold text-on-surface mb-1 text-lg">
                      {step.title}
                    </h3>
                    <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <Icon
                      name="keyboard_double_arrow_down"
                      className="text-outline md:hidden shrink-0 mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary">
              <Icon name="quiz" fill />
            </div>
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">
                {t("tentang.faqTitle")}
              </h2>
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                PERTANYAAN YANG SERING DIAJUKAN
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    open
                      ? "border-primary shadow-md"
                      : "border-outline-variant hover:border-primary/40"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left bg-surface hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-label-sm shrink-0 transition-colors ${
                          open
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-body-md font-bold text-on-surface">
                        {faq.q}
                      </span>
                    </div>
                    <Icon
                      name={open ? "remove" : "add"}
                      className={`shrink-0 transition-colors ${open ? "text-primary" : "text-on-surface-variant"}`}
                    />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pt-1 bg-surface-container-low border-t border-outline-variant">
                      <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed pl-10">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-primary rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <Icon name="support_agent" fill style={{ fontSize: 160 }} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-headline-md text-headline-md mb-1">
                Masih ada pertanyaan?
              </h3>
              <p className="text-body-md opacity-90">
                Tim support kami siap membantu 24/7 melalui live chat.
              </p>
            </div>
            <button
              onClick={() => router.push("/customer-service")}
              className="shrink-0 flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-button hover:bg-surface-container-low transition-all active:scale-95"
            >
              <Icon name="headset_mic" />
              Buka Live Chat
            </button>
          </div>
        </section>

      </div>
    </AppShell>
  );
}