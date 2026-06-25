"""SOULDAWN — AI assistant service with metrics."""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

from aiohttp import ClientSession, ClientTimeout

from config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL

logger = logging.getLogger("SOULDAWN.ai")

SOULDAWN_KB = """Ты — AI-ассистент бренда SOULDAWN, streetwear-бренд одежды.

Данные:
- Название: SOULDAWN · Девиз: БОРЬБА · АУТЕНТИЧНОСТЬ · РАССВЕТ
- Товары: Hoodies (7 990-10 490₽), T-Shirts (3 990-5 490₽), Pants (9 490-11 990₽), Accessories (2 990-6 490₽)
- Размеры: S/M/L/XL, оверсайз
- Доставка: СДЭК 350₽, Почта 250₽, Яндекс 300₽. Бесплатно от 5 000₽
- Возврат: 14 дней, с бирками
- Оплата: Visa/MC/МИР, СБП, YooKassa
- Качество: 100% хлопок, YKK фурнитура

Правила:
- Отвечай КОРОТКО (до 500 символов)
- Всегда отвечай на русском языке
- Если вопрос связан с брендом, товарами, доставкой — ОТВЕЧАЙ, не отправляй оператору
- Если вопрос вне тематики бренда, ИЛИ это жалоба/спор/возврат/личные данные — ответь ровно одно слово: HANDOFF
- Никогда не упоминай что ты ИИ, не извиняйся"""


@dataclass
class AIMetrics:
    """Runtime AI usage metrics."""
    total_questions: int = 0
    ai_answered: int = 0
    handoffs: int = 0
    errors: int = 0
    total_latency_ms: float = 0.0
    last_error: str = ""
    last_error_time: datetime | None = None
    last_success_time: datetime | None = None
    recent_questions: list = field(default_factory=list)  # last 20

    def record_answer(self, question: str, latency_ms: float, was_handoff: bool, error: str = ""):
        self.total_questions += 1
        if error:
            self.errors += 1
            self.last_error = error[:200]
            self.last_error_time = datetime.now(timezone.utc)
        elif was_handoff:
            self.handoffs += 1
        else:
            self.ai_answered += 1
            self.last_success_time = datetime.now(timezone.utc)
        self.total_latency_ms += latency_ms
        self.recent_questions.append({
            "q": question[:80],
            "ms": round(latency_ms, 0),
            "result": "handoff" if was_handoff else ("error" if error else "answered"),
            "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
        # Keep only last 20
        if len(self.recent_questions) > 20:
            self.recent_questions = self.recent_questions[-20:]

    @property
    def avg_latency_ms(self) -> float:
        return round(self.total_latency_ms / max(self.total_questions, 1), 1)

    @property
    def success_rate(self) -> str:
        if self.total_questions == 0:
            return "N/A"
        answered = self.ai_answered / self.total_questions * 100
        return f"{answered:.0f}%"


# Global metrics instance
metrics = AIMetrics()

# Runtime toggle (admins can flip via /admin)
_auto_respond: bool = True


def is_auto_respond() -> bool:
    return _auto_respond


def set_auto_respond(value: bool) -> None:
    global _auto_respond
    _auto_respond = value


async def ask_ai(text: str) -> str:
    """Ask AI. Returns response text, or 'HANDOFF' if should escalate."""
    if not OPENAI_API_KEY:
        logger.warning("AI: OPENAI_API_KEY not set")
        return "HANDOFF"

    t0 = time.time()
    try:
        async with ClientSession() as s:
            async with s.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": SOULDAWN_KB},
                        {"role": "user", "content": text},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
                timeout=ClientTimeout(total=30),
            ) as r:
                latency = (time.time() - t0) * 1000
                body = await r.json()

                if r.status != 200:
                    err_msg = f"HTTP {r.status}: {str(body)[:200]}"
                    logger.error(f"AI error: {err_msg}")
                    metrics.record_answer(text, latency, was_handoff=False, error=err_msg)
                    return "HANDOFF"

                content = body.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not content:
                    metrics.record_answer(text, latency, was_handoff=False, error="empty response")
                    return "HANDOFF"

                content = content.strip()
                is_handoff = content == "HANDOFF"
                metrics.record_answer(text, latency, was_handoff=is_handoff)
                return content

    except Exception as e:
        latency = (time.time() - t0) * 1000
        err_msg = f"{type(e).__name__}: {e}"
        logger.error(f"AI exception: {err_msg}")
        metrics.record_answer(text, latency, was_handoff=False, error=err_msg)
        return "HANDOFF"


async def test_ai() -> dict:
    """Test AI with a simple diagnostic question. Returns status dict."""
    if not OPENAI_API_KEY:
        return {"ok": False, "error": "OPENAI_API_KEY not set"}

    t0 = time.time()
    try:
        async with ClientSession() as s:
            # First test: list models
            async with s.get(
                f"{OPENAI_BASE_URL}/models",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                timeout=ClientTimeout(total=10),
            ) as r:
                models_status = r.status
                models_body = await r.json()

            # Second test: actual chat completion
            async with s.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "messages": [
                        {"role": "user", "content": "Привет, это тест. Ответь одним словом: OK"},
                    ],
                    "max_tokens": 10,
                    "temperature": 0,
                },
                timeout=ClientTimeout(total=15),
            ) as r2:
                chat_status = r2.status
                chat_body = await r2.json()

            latency = round((time.time() - t0) * 1000)

            if chat_status == 200:
                reply = chat_body.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {
                    "ok": True,
                    "models_endpoint": models_status,
                    "chat_endpoint": chat_status,
                    "model": OPENAI_MODEL,
                    "latency_ms": latency,
                    "test_reply": reply.strip()[:100],
                }
            else:
                return {
                    "ok": False,
                    "models_endpoint": models_status,
                    "chat_endpoint": chat_status,
                    "model": OPENAI_MODEL,
                    "latency_ms": latency,
                    "error": f"HTTP {chat_status}: {str(chat_body)[:200]}",
                }

    except Exception as e:
        return {
            "ok": False,
            "error": f"{type(e).__name__}: {e}",
            "latency_ms": round((time.time() - t0) * 1000),
        }


def get_metrics_text() -> str:
    """Format metrics for admin display."""
    m = metrics
    lines = [
        "🤖 <b>AI МЕТРИКИ</b>",
        "═══════════════════════",
        f"📊 Всего запросов: <b>{m.total_questions}</b>",
        f"✅ AI ответил: <b>{m.ai_answered}</b> ({m.success_rate})",
        f"🔀 Хэндоффы: <b>{m.handoffs}</b>",
        f"❌ Ошибки: <b>{m.errors}</b>",
        f"⏱️ Средняя задержка: <b>{m.avg_latency_ms}ms</b>",
    ]
    if m.last_success_time:
        lines.append(f"🟢 Последний успех: {m.last_success_time.strftime('%d.%m %H:%M')}")
    if m.last_error_time:
        lines.append(f"🔴 Последняя ошибка: {m.last_error_time.strftime('%d.%m %H:%M')}")
        lines.append(f"   {m.last_error[:100]}")
    return "\n".join(lines)


def get_recent_questions_text() -> str:
    """Format recent AI questions for admin display."""
    m = metrics
    if not m.recent_questions:
        return "📭 Нет запросов за эту сессию."

    lines = ["📋 <b>ПОСЛЕДНИЕ AI-ЗАПРОСЫ</b>\n"]
    for i, q in enumerate(reversed(m.recent_questions[-10:]), 1):
        emoji = {"answered": "✅", "handoff": "🔀", "error": "❌"}.get(q["result"], "⚪")
        lines.append(f"{emoji} <code>{q['time'][11:16]}</code> {q['q'][:50]} ({q['ms']}ms)")
    return "\n".join(lines)