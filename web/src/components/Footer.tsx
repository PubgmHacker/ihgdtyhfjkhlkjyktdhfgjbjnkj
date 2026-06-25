import Link from "next/link";
import SDLogo from "./SDLogo";

const links = [
  { href: "/collection", label: "Каталог" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/about", label: "О бренде" },
  { href: "/contact", label: "Контакты" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#0A0A0C] mt-auto">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        {/* Top section */}
        <div className="py-12 md:py-16 flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-20">
          {/* Left: Brand */}
          <div className="md:max-w-xs">
            <div className="mb-4">
              <SDLogo size="md" />
            </div>
            <p className="text-[13px] text-[#6B6B78]/70 leading-relaxed">
              Твоя одежда — отражение твоей внутренней борьбы.
            </p>
          </div>

          {/* Right: Links */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-200 w-fit"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://instagram.com/souldawnclothes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-200 w-fit"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com/@souldawnclothes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-200 w-fit"
            >
              TikTok
            </a>
            <a
              href="https://t.me/souldawnclothes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-200 w-fit"
            >
              Telegram
            </a>
            <a
              href="https://youtube.com/@souldawnclothes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6B6B78]/60 hover:text-[#C8C8D0] transition-colors duration-200 w-fit"
            >
              YouTube
            </a>
          </div>
        </div>

        {/* Bottom line */}
        <div className="py-5 border-t border-white/[0.04] flex items-center justify-between gap-2">
          <p className="text-[11px] text-[#6B6B78]/40">
            © 2026 SOULDAWN
          </p>
          <p className="text-[11px] text-[#6B6B78]/25 tracking-[0.15em] uppercase">
            Борьба · Аутентичность · Рассвет
          </p>
          <img
            src="/sd-logo.png"
            alt=""
            className="h-7 w-7 object-contain opacity-35"
          />
        </div>
      </div>
    </footer>
  );
}