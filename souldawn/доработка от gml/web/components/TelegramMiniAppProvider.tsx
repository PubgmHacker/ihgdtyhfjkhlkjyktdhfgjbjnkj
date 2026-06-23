"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: any;
        user?: any;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        ready: () => void;
        close: () => void;
        showPopup: (params: any) => void;
        showAlert: (message: string, callback?: () => void) => void;
        hapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isActive: boolean;
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export function TelegramMiniAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();

  // Флаг, что мы уже пробовали авто-логин — чтобы не дублировать попытки
  // при каждой смене loading/user (старая реализация страдала race condition).
  const authAttempted = useRef(false);

  const authenticateMiniApp = useCallback(
    async (initData: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/mini-app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ initData }),
        });

        const data = await response.json();

        if (data.success && data.user) {
          // Сессия живёт в httpOnly-куке (sd_access_token).
          // Обновляем AuthContext из /me, чтобы UI синхронизировался без жёсткого редиректа.
          await refreshUser?.();
          // Мягкий переход в личный кабинет, если мы на корне/профиле.
          if (
            typeof window !== "undefined" &&
            (window.location.pathname === "/" ||
              window.location.pathname === "/profile")
          ) {
            router.push("/dashboard");
          }
          return true;
        }
        console.warn("[mini-app] auth not successful:", data.error);
        return false;
      } catch (error) {
        console.error("[mini-app] auth error:", error);
        return false;
      }
    },
    [router, refreshUser]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) {
      setIsReady(true);
      return;
    }

    const tg = window.Telegram.WebApp;

    // Сообщаем Telegram, что WebApp готов — initData гарантированно заполнен.
    try {
      tg.ready();
      // Тема под новый бренд (графит #08080A).
      tg.setHeaderColor?.("#08080A");
      tg.setBackgroundColor?.("#08080A");
    } catch {}

    setIsMiniApp(true);
    setIsReady(true);

    // ── Авто-логин ────────────────────────────────────────────────
    // Запускаем ОДИН раз, только когда AuthContext закончил первичную
    // загрузку (loading=false) и пользователь не авторизован.
    if (authAttempted.current) return;
    if (loading) return;
    if (user) return; // уже залогинен — ничего делать не надо

    const initData = tg.initData;
    if (!initData) return;

    authAttempted.current = true;

    (async () => {
      const ok = await authenticateMiniApp(initData);
      // Один ретрай через 1.5с — insurance против холодного старта API.
      if (!ok) {
        await new Promise((r) => setTimeout(r, 1500));
        await authenticateMiniApp(initData);
      }
    })();
  }, [loading, user, authenticateMiniApp]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to use Telegram Web App features
 */
export function useTelegramWebApp() {
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMiniApp(!!window.Telegram?.WebApp);
    }
  }, []);

  const showAlert = (message: string) => {
    if (isMiniApp && window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const hapticFeedback = (type: "success" | "error" | "warning" = "success") => {
    if (isMiniApp && window.Telegram?.WebApp?.hapticFeedback) {
      window.Telegram.WebApp.hapticFeedback.notificationOccurred(type);
    }
  };

  const close = () => {
    if (isMiniApp && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return {
    isMiniApp,
    showAlert,
    hapticFeedback,
    close,
    tg: window.Telegram?.WebApp,
  };
}
