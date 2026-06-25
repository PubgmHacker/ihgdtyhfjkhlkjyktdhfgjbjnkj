import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SupportChat from "@/components/SupportChat";
import CustomCursor from "@/components/CustomCursor";
import PageFog from "@/components/PageFog";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

// Font preloader script — prevents FOUC
const fontPreload = `
  (function() {
    try {
      if (document.fonts && document.fonts.load) {
        document.fonts.load('900 72px "Oswald"').catch(function(){});
        document.fonts.load('700 16px "Inter"').catch(function(){});
      }
    } catch(e) {}
  })();
`;

export const metadata: Metadata = {
  title: "SOULDAWN — Одежда для тех, кто борется",
  description:
    "Твоя одежда — это отражение твоей внутренней борьбы. Уличная культура встречает спорт.",
  keywords: ["SOULDAWN", "спортивная одежда", "streetwear", "MMA", "бокс", "коллекция"],
  openGraph: {
    title: "SOULDAWN — Рассвет после боя",
    description: "Спортивная одежда с характером.",
    siteName: "SOULDAWN",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontPreload }} />
      </head>
      <body
        className={`${inter.variable} ${oswald.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300`}
      >
        <Providers>
          <CustomCursor />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <SupportChat />
          <PageFog />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}