import type { Metadata } from "next";
import "./globals.css";
import { archivo, geist } from "@/lib/fonts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import SupportChat from "@/components/SupportChat";

export const metadata: Metadata = {
  title: "SOULDAWN — Одежда для тех, кто борется",
  description:
    "Спортивная одежда с характером. Уличная культура встречает спорт. Твоя одежда — это отражение твоей внутренней борьбы.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${archivo.variable} ${geist.variable}`}>
      <body className="bg-bg text-text antialiased font-sans">
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <SupportChat />
        </Providers>
      </body>
    </html>
  );
}
