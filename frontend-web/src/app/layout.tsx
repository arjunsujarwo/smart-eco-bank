import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { EchoProvider } from "@/context/EchoContext";
import I18nProvider from "@/providers/I18nProvider";
import OnboardingExperience from "@/components/OnboardingExperience";

export const metadata: Metadata = {
  title: "Smart Eco Bank",
  description: "Ubah Sampah Jadi Poin & Aset Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* Fonts dimuat via <link> (sama seperti mockup) agar tidak perlu
            fetch saat build dan tetap jalan di lingkungan offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="font-body-md">
        <I18nProvider>
          <AuthProvider>
            <EchoProvider>
              {children}
              <OnboardingExperience />
            </EchoProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
