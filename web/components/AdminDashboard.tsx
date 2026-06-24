"use client";

import { useState, useEffect, useCallback } from "react";

interface DashboardStats {
  total_users: number; online_users: number; new_today: number;
  total_orders: number; orders_today: number; pending_orders: number;
  total_revenue: number; revenue_today: number; net_profit: number;
  db_connected: boolean;
}
interface Order { id: string; items: any; total: number; status: string; created_at: string; username?: string; name?: string; }
interface DashboardUser { id: string; telegram_id: number; username: string; name: string; is_admin: boolean; created_at: string; last_seen?: string; }
type Tab = "overview" | "orders" | "users" | "analytics" | "settings";

export default function AdminDashboard({ adminId, role }: { adminId: number; role?: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  // Settings
  const [buyMode, setBuyMode] = useState<"buy" | "preorder">("buy");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const opts: RequestInit = { credentials: "include", headers: { "Content-Type": "application/json" } };
      const [statsRes, ordersRes, usersRes, settingsRes] = await Promise.all([
        fetch("/api/admin/stats", opts),
        fetch("/api/admin/recent-orders", opts),
        fetch("/api/admin/users", opts),
        fetch("/api/admin/settings", opts),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.buy_button_mode) setBuyMode(s.buy_button_mode as "buy" | "preorder");
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ buy_button_mode: buyMode }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally { setSettingsLoading(false); }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "pending") return o.status === "pending" || o.status === "processing";
    if (filter === "completed") return o.status === "delivered" || o.status === "paid";
    return true;
  });

  const formatPrice = (k: number) => (k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  const getStatusColor = (s: string) => {
    if (s === "pending" || s === "processing") return "bg-yellow-500/10 text-yellow-400";
    if (s === "paid" || s === "shipped") return "bg-blue-500/10 text-blue-400";
    if (s === "delivered") return "bg-accent/10 text-accent";
    if (s === "cancelled") return "bg-red-500/10 text-red-400";
    return "bg-white/10 text-white";
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = { pending: "Ожидает", processing: "Обработка", paid: "Оплачен", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" };
    return map[s] || s;
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Обзор" },
    { key: "orders", label: "Заказы" },
    { key: "users", label: "Пользователи" },
    { key: "analytics", label: "Аналитика" },
    { key: "settings", label: "⚙️ Настройки" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold tracking-superwide uppercase text-accent mb-2">Администратор</p>
          <h1 className="text-4xl font-black uppercase">Дашборд</h1>
        </div>
        <div className="text-right">
          {!stats?.db_connected && (
            <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-[10px] font-bold tracking-wide">БД НЕ ПОДКЛЮЧЕНА</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${tab === t.key ? "border-b-2 border-accent text-accent" : "text-muted hover:text-text"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Пользователей", value: stats?.total_users || 0, sub: stats?.new_today ? `+${stats.new_today} сегодня` : null, foot: stats?.online_users ? `${stats.online_users} онлайн` : null, icon: "👥" },
              { label: "Заказов", value: stats?.total_orders || 0, sub: stats?.orders_today ? `+${stats.orders_today} сегодня` : null, foot: stats?.pending_orders ? `${stats.pending_orders} в ожидании` : null, icon: "📦" },
              { label: "Выручка", value: `${formatPrice(stats?.total_revenue || 0)} ₽`, sub: stats?.revenue_today ? `+${formatPrice(stats.revenue_today)} сегодня` : null, foot: null, icon: "💰" },
              { label: "Прибыль", value: `${formatPrice(stats?.net_profit || 0)} ₽`, sub: null, foot: null, icon: "📈" },
            ].map((card) => (
              <div key={card.label} className="border border-white/10 bg-surface/50 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] text-muted font-bold tracking-wider uppercase mb-1">{card.label}</p>
                    <p className="text-2xl font-black">{card.value}</p>
                    {card.sub && <p className="text-[10px] text-accent mt-1">{card.sub}</p>}
                  </div>
                  <div className="text-2xl">{card.icon}</div>
                </div>
                {card.foot && <div className="pt-3 border-t border-white/10 text-[10px] text-muted">{card.foot}</div>}
              </div>
            ))}
          </div>
          <div className="border border-white/10 bg-surface/50 p-6">
            <h3 className="text-xs font-bold tracking-wider uppercase text-accent mb-4">Последние заказы</h3>
            {orders.length === 0 ? <p className="text-sm text-muted">Заказов нет</p> : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="border border-white/5 p-3 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div><p className="text-sm font-bold">#{o.id}</p><p className="text-[10px] text-muted">{o.name || o.username || "Unknown"}</p></div>
                      <div className="text-right"><p className="font-bold">{formatPrice(o.total)} ₽</p><span className={`inline-block text-[10px] font-bold px-2 py-1 mt-1 ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors ${filter === f ? "bg-accent text-bg" : "border border-white/10 hover:border-white/20"}`}>
                {f === "all" ? "Все" : f === "pending" ? "В ожидании" : "Завершённые"}
              </button>
            ))}
          </div>
          <div className="border border-white/10 bg-surface/50 p-6">
            {filteredOrders.length === 0 ? <p className="text-center text-muted py-8">Заказы не найдены</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10">
                    <tr>{["ID","Клиент","Сумма","Статус","Дата"].map((h) => <th key={h} className="text-left py-3 px-2 font-bold text-[10px] tracking-wider uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2"><span className="font-bold text-accent">#{o.id}</span></td>
                        <td className="py-3 px-2">{o.name || o.username || "Unknown"}</td>
                        <td className="py-3 px-2 font-bold">{formatPrice(o.total)} ₽</td>
                        <td className="py-3 px-2"><span className={`inline-block px-2 py-1 text-[10px] font-bold ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></td>
                        <td className="py-3 px-2 text-muted">{new Date(o.created_at).toLocaleDateString("ru-RU")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="border border-white/10 bg-surface/50 p-6">
          {users.length === 0 ? <p className="text-center text-muted py-8">Пользователей не найдено</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>{["ID","Имя","Username","Роль","Присоединился","Последний вход"].map((h) => <th key={h} className="text-left py-3 px-2 font-bold text-[10px] tracking-wider uppercase">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 font-bold text-accent">{u.telegram_id}</td>
                      <td className="py-3 px-2">{u.name || "-"}</td>
                      <td className="py-3 px-2 text-muted">@{u.username || "-"}</td>
                      <td className="py-3 px-2">{u.is_admin ? <span className="px-2 py-1 bg-accent/20 text-accent text-[10px] font-bold rounded">Админ</span> : <span className="text-muted text-[10px]">Пользователь</span>}</td>
                      <td className="py-3 px-2 text-[10px] text-muted">{new Date(u.created_at).toLocaleDateString("ru-RU")}</td>
                      <td className="py-3 px-2 text-[10px] text-muted">{u.last_seen ? new Date(u.last_seen).toLocaleDateString("ru-RU") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div className="border border-white/10 bg-surface/50 p-6">
          <h3 className="text-xs font-bold tracking-wider uppercase text-accent mb-4">Статистика по времени</h3>
          <div className="text-center py-12"><p className="text-muted">Аналитика будет доступна после интеграции графиков</p></div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="space-y-6">
          <div className="border border-white/10 bg-surface/50 p-6 space-y-6">
            <h3 className="text-xs font-bold tracking-wider uppercase text-accent">Настройки магазина</h3>

            {/* Кнопка покупки */}
            <div>
              <p className="text-sm font-bold mb-1">Режим кнопки покупки</p>
              <p className="text-[11px] text-muted mb-4">Переключает текст кнопки на всех карточках товаров и в модальном окне.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBuyMode("buy")}
                  className={`px-6 py-3 text-xs font-black tracking-wider uppercase border transition-all duration-200 ${buyMode === "buy" ? "bg-accent text-bg border-accent" : "border-white/10 text-muted hover:border-white/30"}`}
                >
                  🛒 Купить
                </button>
                <button
                  onClick={() => setBuyMode("preorder")}
                  className={`px-6 py-3 text-xs font-black tracking-wider uppercase border transition-all duration-200 ${buyMode === "preorder" ? "bg-accent text-bg border-accent" : "border-white/10 text-muted hover:border-white/30"}`}
                >
                  ⏳ Предзаказ
                </button>
              </div>
              <p className="text-[10px] text-muted/50 mt-2">
                Текущий режим: <span className="text-accent font-bold">{buyMode === "buy" ? "Купить" : "Предзаказ"}</span>
              </p>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <button
              onClick={saveSettings}
              disabled={settingsLoading}
              className={`px-8 py-3 text-xs font-black tracking-wider uppercase transition-all duration-300 ${settingsSaved ? "bg-green-500 text-bg" : "bg-accent text-bg hover:bg-white"} disabled:opacity-50`}
            >
              {settingsSaved ? "✓ Сохранено" : settingsLoading ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
