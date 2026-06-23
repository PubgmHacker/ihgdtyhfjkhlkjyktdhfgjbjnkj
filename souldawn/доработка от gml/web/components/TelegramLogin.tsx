"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Username бота (без @), привязанного к домену сайта в @BotFather через /setdomain.
 *
 * Если переменная пуста — внешний Telegram Login Widget НЕ рендерится,
 * потому что именно он отдаёт ошибку «Username Invalid» в iframe при
 * неверном/ненастроенном боте. Вместо этого показываем нативный фолбэк.
 */
const BOT_NAME = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "").trim();
const BOT_ENABLED = !!BOT_NAME;

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export default function TelegramLogin({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loginWithWidget, user } = useAuth();
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    if (user) return;
    // Если бот не настроен — вообще не трогаем внешний виджет.
    if (!BOT_ENABLED || !containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_NAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "2");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    script.onerror = () => setWidgetLoaded(false);

    // Колбэк авторизации — отправляет данные виджета в /api/auth/telegram.
    window.onTelegramAuth = (telegramUser: TelegramUser) => {
      loginWithWidget(telegramUser as any);
    };

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [user, loginWithWidget]);

  if (user) return null;

  return (
    <div className={className}>
      {BOT_ENABLED ? (
        <div ref={containerRef} className="flex justify-center min-h-[48px]" />
      ) : (
        <FallbackTelegramHint />
      )}
    </div>
  );
}

/**
 * Фолбэк: бот не привязан к домену. Показываем аккуратную подсказку вместо
 * сломанного внешнего виджета (который иначе рендерит «Username Invalid»).
 */
function FallbackTelegramHint() {
  return (
    <div className="w-full rounded-md border border-line bg-surface/50 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <TelegramGlyph className="w-4 h-4 text-muted" />
        <span className="text-xs font-bold tracking-widest uppercase text-text-dim">
          Telegram
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        Вход через Telegram доступен из мобильного приложения и Mini&nbsp;App.
        На сайте используйте email-вход ниже.
      </p>
    </div>
  );
}

function TelegramGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.8 8.74-7.9c.38-.34-.08-.53-.59-.19L6.78 13.2l-4.64-1.45c-1.01-.31-1.03-1.01.21-1.5l18.14-7c.84-.31 1.58.2 1.45 1.35z" />
    </svg>
  );
}
