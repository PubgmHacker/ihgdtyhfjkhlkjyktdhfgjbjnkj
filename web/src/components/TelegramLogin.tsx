"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const BOT_NAME = "souldawnclothes_bot";

declare global {
  interface Window {
    TelegramLoginWidget?: { dataAuth: (data: unknown) => void };
    onTelegramAuth?: (user: unknown) => void;
  }
}

export default function TelegramLogin({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loginWithWidget, user } = useAuth();

  useEffect(() => {
    if (user) return;
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_NAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "0");
    // No data-request-access — login widget defaults to read access.
    // "write" causes Telegram to reject the auth attempt with an error.
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    window.onTelegramAuth = (telegramUser: unknown) => {
      loginWithWidget(telegramUser as Record<string, unknown>);
    };

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [user, loginWithWidget]);

  if (user) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}