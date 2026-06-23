"use client";
import { useState, useEffect } from "react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archive" | "diagnose">("active");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagLogs, setDiagLogs] = useState<any[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (err) { console.error(err); }
  };

  const runDiagnostics = async () => {
    try {
      const res = await fetch("/api/admin/diagnose");
      const data = await res.json();
      if (data.reports) setDiagLogs(data.reports);
    } catch (err) { console.error(err); }
  };

  const runAutoFix = async () => {
    setIsFixing(true);
    setFixResult(null);
    try {
      const res = await fetch("/api/admin/diagnose", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFixResult(data.message);
        runDiagnostics();
      } else {
        setFixResult("❌ Ошибка автоисправления: " + data.error);
      }
    } catch (err: any) {
      setFixResult("🚨 Сбой сети: " + err.message);
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => {
    loadTickets();
    runDiagnostics();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTickets = tickets.filter((t: any) => t.status === "open" || t.status === "operator");
  const archiveTickets = tickets.filter((t: any) => t.status === "resolved" || t.status === "closed");

  return (
    <div className="min-h-screen bg-[#0e0e10] text-zinc-300 p-4 font-mono select-none">
      <div className="text-center my-2">
        <h1 className="text-xl font-black text-zinc-100 uppercase italic">SOUL<span className="text-amber-500">DAWN</span> · TERMINAL</h1>
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest">// COGNITIVE_ADMIN_INTERFACE</p>
      </div>

      <div className="flex border border-zinc-800 bg-zinc-900/40 mb-4 p-1 rounded-sm text-xs">
        <button onClick={() => setActiveTab("active")} className={`flex-1 py-2 text-center uppercase font-black cursor-pointer border-none ${activeTab === "active" ? "bg-amber-500 text-black" : "text-zinc-500"}`}>[ АКТИВНЫЕ ({activeTickets.length}) ]</button>
        <button onClick={() => setActiveTab("archive")} className={`flex-1 py-2 text-center uppercase font-black cursor-pointer border-none ${activeTab === "archive" ? "bg-amber-500 text-black" : "text-zinc-500"}`}>[ АРХИВ ({archiveTickets.length}) ]</button>
        <button onClick={() => setActiveTab("diagnose")} className={`flex-1 py-2 text-center uppercase font-black cursor-pointer border-none ${activeTab === "diagnose" ? "bg-amber-500 text-black" : "text-zinc-500"}`}>[ 🛠️ ИИ_ДИАГНОСТИКА ]</button>
      </div>

      {activeTab === "diagnose" ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="border border-zinc-800 bg-zinc-950 p-3 rounded-sm space-y-2 text-xs">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider">// КАРТА СИСТЕМНЫХ ТРАССИРОВОК:</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {diagLogs.map((log) => (
                <div key={log.id} className="p-2 bg-zinc-900/40 border border-zinc-900 flex flex-col gap-1 rounded-sm text-left">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 font-bold">Файл: <code className="text-zinc-300">{log.path}</code></span>
                    <span className={`px-1.5 py-0.5 font-black uppercase text-[8px] border rounded-sm ${log.status === "OK" ? "bg-green-950/40 text-green-400 border-green-500/20" : "bg-red-950/40 text-red-400 border-red-500/20"}`}>{log.status} | {log.code}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{log.info}</p>
                </div>
              ))}
            </div>
          </div>
          {fixResult && <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs rounded-sm text-left leading-relaxed">{fixResult}</div>}
          <button onClick={runAutoFix} disabled={isFixing} className="w-full bg-transparent border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-black py-4 uppercase tracking-widest text-xs rounded-sm cursor-pointer transition-all active:scale-95">{isFixing ? "⚡ ВЫПОЛНЯЕТСЯ АВТОИСПРАВЛЕНИЕ..." : "🛠️ ИСПРАВИТЬ ВСЕ ОБНАРУЖЕННЫЕ БАГИ"}</button>
        </div>
      ) : (
        <div className="space-y-2 text-left text-xs">
          {(activeTab === "active" ? activeTickets : archiveTickets).length === 0 ? (
            <div className="border border-dashed border-zinc-800 p-8 text-center text-zinc-600 uppercase">// Запросы отсутствуют.</div>
          ) : (
            (activeTab === "active" ? activeTickets : archiveTickets).map((ticket: any) => (
              <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="bg-zinc-900/20 border border-zinc-800 p-3 rounded-sm border-l-2 border-l-amber-500 cursor-pointer">
                <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-zinc-400 uppercase bg-zinc-900 px-1 border border-zinc-800">{ticket.user ? ticket.user.name : "Посетитель"}</span><span className="text-zinc-600">ID: #{ticket.id.slice(-5)}</span></div>
                <p className="text-zinc-300 truncate mt-1">{ticket.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
