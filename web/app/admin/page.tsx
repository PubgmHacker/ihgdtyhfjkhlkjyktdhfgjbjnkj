"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from "react";

interface Ticket {
  id: string; category: string; message: string; status: string;
  createdAt: string; user?: { name: string; username?: string; telegramId?: string } | null;
}
interface Log { id: string; sender: string; message: string; createdAt: string; }

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch("/api/admin/tickets").catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  const loadLogs = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/messages?ticketId=${ticketId}`).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    setLogs(data.messages || []);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadLogs(selected.id);
    const iv = setInterval(() => loadLogs(selected.id), 3000);
    return () => clearInterval(iv);
  }, [selected]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selected.id, message: reply.trim() }),
    }).catch(() => {});
    setReply("");
    setSending(false);
    loadLogs(selected.id);
  };

  const active = tickets.filter(t => t.status === "open" || t.status === "operator");
  const archive = tickets.filter(t => t.status === "resolved" || t.status === "closed");
  const shown = tab === "active" ? active : archive;

  const senderColor = (s: string) => {
    if (s === "user") return "bg-zinc-800 text-zinc-200 self-start";
    if (s === "operator") return "bg-amber-500 text-black self-end";
    if (s === "ai") return "bg-blue-900/60 text-blue-200 self-start";
    return "bg-zinc-900 text-zinc-500 self-start text-[10px] italic";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-mono flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-black uppercase text-zinc-100">
          SOUL<span className="text-amber-500">DAWN</span> · Поддержка
        </h1>
        <div className="flex gap-2 text-xs">
          <button onClick={() => { setTab("active"); setSelected(null); }}
            className={`px-3 py-1.5 font-bold uppercase ${tab === "active" ? "bg-amber-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
            Активные ({active.length})
          </button>
          <button onClick={() => { setTab("archive"); setSelected(null); }}
            className={`px-3 py-1.5 font-bold uppercase ${tab === "archive" ? "bg-amber-500 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
            Архив ({archive.length})
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Список тикетов */}
        <div className="w-72 border-r border-zinc-800 overflow-y-auto flex-shrink-0">
          {shown.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 text-xs uppercase">Нет обращений</div>
          ) : shown.map(t => (
            <div key={t.id} onClick={() => setSelected(t)}
              className={`p-3 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/40 transition-colors ${selected?.id === t.id ? "bg-zinc-800/60 border-l-2 border-l-amber-500" : ""}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{t.user?.name || "Посетитель"}</span>
                <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase ${t.status === "operator" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
                  {t.status === "operator" ? "У оператора" : t.status === "open" ? "Открыт" : t.status}
                </span>
              </div>
              <p className="text-xs text-zinc-300 truncate">{t.message}</p>
              <p className="text-[9px] text-zinc-600 mt-1">{t.category} · #{t.id.slice(-6)}</p>
            </div>
          ))}
        </div>

        {/* Чат тикета */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs uppercase">
              Выбери тикет слева
            </div>
          ) : (
            <>
              {/* Шапка тикета */}
              <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-200">{selected.user?.name || "Посетитель"}</span>
                  {selected.user?.username && <span className="text-[10px] text-zinc-500 ml-2">@{selected.user.username}</span>}
                  {selected.user?.telegramId && <span className="text-[10px] text-zinc-600 ml-2">ID: {selected.user.telegramId}</span>}
                </div>
                <span className="text-[9px] text-zinc-500 uppercase">{selected.category} · #{selected.id.slice(-8)}</span>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col">
                {logs.map(log => (
                  <div key={log.id} className={`max-w-[80%] rounded-sm px-3 py-2 text-xs flex flex-col gap-0.5 ${senderColor(log.sender)}`}>
                    <span className="text-[8px] opacity-60 uppercase font-bold">{log.sender}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>

              {/* Поле ответа */}
              <div className="border-t border-zinc-800 p-3 flex gap-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Ответ оператора... (Enter — отправить)"
                  style={{ fontSize: "16px" }}
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 rounded-sm"
                />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="bg-amber-500 text-black font-black text-[10px] px-4 uppercase disabled:opacity-40 rounded-sm">
                  {sending ? "..." : "Отправить"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
