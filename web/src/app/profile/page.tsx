"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TelegramLogin from "@/components/TelegramLogin";
import SocialLogins from "@/components/SocialLogins";
import ScrollReveal from "@/components/ScrollReveal";

type AuthTab = "login" | "register";
type RegStep = "email" | "code";

function LoginForm() {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      if (result.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{ fontSize: "16px" }}
        className="w-full bg-[#101014] border border-[rgba(200,200,210,0.14)] px-4 py-3 text-sm text-[#E8E8F0] placeholder:text-[#6B6B78]/50 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        required
        style={{ fontSize: "16px" }}
        className="w-full bg-[#101014] border border-[rgba(200,200,210,0.14)] px-4 py-3 text-sm text-[#E8E8F0] placeholder:text-[#6B6B78]/50 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors"
      />
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] transition-colors duration-300 disabled:opacity-50"
      >
        {loading ? "..." : "Войти"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<RegStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus code input when step changes
  useEffect(() => {
    if (step === "code" && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setStep("code");
      setDevMode(!!data.devMode);
      startCooldown(data.expiresIn || 600);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Введите 6-значный код");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный код");
        return;
      }
      // Auto-login: refresh user state and redirect
      await refreshUser();
      router.push("/dashboard");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setDevMode(!!data.devMode);
      startCooldown(data.expiresIn || 600);
      setError("");
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Email ──
  if (step === "email") {
    return (
      <form onSubmit={handleSendCode} className="w-full space-y-3 mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ fontSize: "16px" }}
          className="w-full bg-[#101014] border border-[rgba(200,200,210,0.14)] px-4 py-3 text-sm text-[#E8E8F0] placeholder:text-[#6B6B78]/50 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors"
        />
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-3.5 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] transition-colors duration-300 disabled:opacity-50"
        >
          {loading ? "..." : "Получить код"}
        </button>
      </form>
    );
  }

  // ── Step 2: Code ──
  return (
    <div className="w-full">
      <p className="text-sm text-[#6B6B78] mb-6 text-center">
        Код отправлен на <span className="text-[#C8C8D0]">{email}</span>
      </p>

      <form onSubmit={handleVerifyCode} className="w-full space-y-3 mb-4">
        <input
          ref={codeInputRef}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
          }}
          placeholder="000000"
          required
          style={{ fontSize: "24px", letterSpacing: "8px" }}
          className="w-full bg-[#101014] border border-[rgba(200,200,210,0.14)] px-4 py-4 text-center text-[#E8E8F0] placeholder:text-[#6B6B78]/30 focus:outline-none focus:border-[rgba(200,200,210,0.3)] transition-colors font-mono tracking-[0.5em]"
        />
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-3.5 text-[11px] font-black tracking-[0.15em] uppercase bg-[#C8C8D0] text-[#08080A] hover:bg-[#E8E8F0] transition-colors duration-300 disabled:opacity-50"
        >
          {loading ? "Проверка..." : "Подтвердить"}
        </button>
      </form>

      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={() => { setStep("email"); setCode(""); setError(""); }}
          className="text-xs text-[#6B6B78] hover:text-[#C8C8D0] transition-colors"
        >
          ← Другой email
        </button>
        {cooldown > 0 ? (
          <span className="text-xs text-[#6B6B78]/50">
            Повторно через {cooldown}с
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-[#C8C8D0]/60 hover:text-[#C8C8D0] transition-colors"
          >
            Отправить повторно
          </button>
        )}
      </div>

      {devMode && (
        <p className="text-[10px] text-[#6B6B78]/40 text-center mt-4">
          Режим разработки: код выведен в консоль сервера
        </p>
      )}
    </div>
  );
}

function AuthForm() {
  const [tab, setTab] = useState<AuthTab>("login");

  return (
    <div className="flex flex-col items-center max-w-sm w-full">
      <div className="w-16 h-16 rounded-full bg-[rgba(200,200,210,0.08)] border border-[rgba(200,200,210,0.14)] flex items-center justify-center mb-6">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[#C8C8D0]"
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <h1 className="font-[family-name:var(--font-oswald)] text-3xl md:text-4xl font-black tracking-tight uppercase mb-2 text-center text-[#E8E8F0]">
        {tab === "login" ? "Войти" : "Регистрация"}
      </h1>
      <p className="text-sm text-[#6B6B78] mb-8 text-center">
        {tab === "login"
          ? "Войдите через email или Telegram"
          : "Подтвердите email — и вы в аккаунте"}
      </p>

      {/* Tab switcher */}
      <div className="flex w-full mb-6 border border-[rgba(200,200,210,0.14)] overflow-hidden">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors ${
            tab === "login"
              ? "bg-[#C8C8D0] text-[#08080A]"
              : "text-[#6B6B78] hover:text-[#E8E8F0]"
          }`}
        >
          Войти
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors ${
            tab === "register"
              ? "bg-[#C8C8D0] text-[#08080A]"
              : "text-[#6B6B78] hover:text-[#E8E8F0]"
          }`}
        >
          Регистрация
        </button>
      </div>

      {/* Form content */}
      {tab === "login" ? <LoginForm /> : <RegisterForm />}

      {/* Divider */}
      <div className="flex items-center gap-3 w-full my-6">
        <div className="flex-1 h-px bg-[rgba(200,200,210,0.14)]" />
        <span className="text-[10px] text-[#6B6B78] uppercase tracking-widest">
          или
        </span>
        <div className="flex-1 h-px bg-[rgba(200,200,210,0.14)]" />
      </div>

      {/* Telegram login */}
      <TelegramLogin />

      {/* Apple / VK */}
      <div className="w-full mt-4">
        <SocialLogins />
      </div>

      <Link
        href="/"
        className="mt-6 text-xs font-bold tracking-widest uppercase px-8 py-3 border border-[rgba(200,200,210,0.14)] text-[#6B6B78] hover:border-[rgba(200,200,210,0.3)] hover:text-[#C8C8D0] transition-colors duration-300"
      >
        Назад на главную
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // /profile — только точка входа. Авторизованных отправляем в личный кабинет.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 border-2 border-[rgba(200,200,210,0.2)] border-t-[#C8C8D0] rounded-full animate-spin mb-6" />
        <p className="text-sm text-[#6B6B78]">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen flex flex-col items-center justify-center px-6">
      <ScrollReveal>
        <AuthForm />
      </ScrollReveal>
    </div>
  );
}