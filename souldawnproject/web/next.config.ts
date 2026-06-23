import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешаем загрузку фото из Telegram Bot API (для отзывов)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.telegram.org",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "*.telegram.org",
      },
    ],
  },

  // Отключаем лишние предупреждения при сборке
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Оптимизация пакетов
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default nextConfig;
