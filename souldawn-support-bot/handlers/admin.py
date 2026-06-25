"""SOULDAWN Support Bot — Admin panel ecosystem.

Provides:
  /admin        — Main admin menu with sub-sections
  /debug        — System diagnostics
  AI management — Toggle AI, test AI, view metrics
  Ticket queue  — View/take open tickets
  Broadcast     — Send message to all users
  Config check  — Validate all env vars
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import time
from datetime import datetime, timezone

import aiohttp
from aiogram import Router, F, Bot
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    Message, CallbackQuery,
    InlineKeyboardButton, InlineKeyboardMarkup,
)
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from config import (
    ADMIN_IDS, ALL_OPERATOR_IDS, SUPPORT_CHAT_IDS,
    DATABASE_URL, OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL,
    SITE_URL, SUPPORT_MINIAPP_URL, BOT_TOKEN, WEBHOOK_SECRET,
)
from services.ai import (
    test_ai, get_metrics_text, get_recent_questions_text,
    metrics as ai_metrics, is_auto_respond, set_auto_respond,
)

router = Router()
logger = logging.getLogger("SOULDAWN.support.admin")


# ═══════════════════════════════════════════════════════════════════
# FSM States
# ═══════════════════════════════════════════════════════════════════

class BroadcastStates(StatesGroup):
    waiting_broadcast_text = State()


# ═══════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════

def _is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


def _is_operator(user_id: int) -> bool:
    return user_id in ALL_OPERATOR_IDS


def _api_base() -> str:
    return SITE_URL.rstrip("/") if SITE_URL else ""


def _api_headers() -> dict:
    """Headers for bot→web API calls (auth via shared secret)."""
    h: dict = {"Content-Type": "application/json"}
    if WEBHOOK_SECRET:
        h["X-Bot-Secret"] = WEBHOOK_SECRET
    return h


def _now() -> str:
    return datetime.now().strftime("%d.%m.%Y %H:%M:%S")


def _uptime() -> str:
    """Bot uptime string."""
    if not hasattr(_uptime, "_start"):
        _uptime._start = time.time()
    s = int(time.time() - _uptime._start)
    h, remainder = divmod(s, 3600)
    m, sec = divmod(remainder, 60)
    return f"{h}ч {m}м {sec}с"


# ═══════════════════════════════════════════════════════════════════
# /admin — Main menu
# ═══════════════════════════════════════════════════════════════════

@router.message(Command("admin"))
async def cmd_admin(message: Message):
    if not _is_operator(message.from_user.id):
        return
    await _show_admin_menu(message)


async def _show_admin_menu(target: Message | CallbackQuery):
    is_cb = isinstance(target, CallbackQuery)
    msg = target.message if is_cb else target
    if is_cb:
        await target.answer()

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статистика", callback_data="adm:stats"),
            InlineKeyboardButton(text="📋 Тикеты", callback_data="adm:tickets"),
        ],
        [
            InlineKeyboardButton(text="🤖 AI Управление", callback_data="adm:ai_menu"),
            InlineKeyboardButton(text="🔍 Диагностика", callback_data="adm:debug"),
        ],
        [
            InlineKeyboardButton(text="📢 Рассылка", callback_data="adm:broadcast"),
            InlineKeyboardButton(text="⚙️ Конфиг", callback_data="adm:config"),
        ],
    ])
    if _api_base():
        kb.inline_keyboard.append([
            InlineKeyboardButton(
                text="🌐 Web-панель",
                web_app={"url": f"{_api_base()}/admin"},
            ),
        ])

    role = "👑 Админ" if _is_admin(msg.from_user.id) else "👥 Оператор"
    text = (
        f"🖥️ <b>SOULDAWN SUPPORT — Панель</b>\n"
        f"{'═' * 28}\n"
        f"Роль: {role}\n"
        f"Время: {_now()}\n"
        f"Аптайм: {_uptime()}\n"
        f"{'═' * 28}"
    )
    await msg.answer(text, parse_mode="HTML", reply_markup=kb)


# ═══════════════════════════════════════════════════════════════════
# 📊 Статистика
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:stats")
async def adm_stats(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return

    # Gather stats from DB
    db_lines = []
    try:
        from database import get_stats
        stats = await get_stats()
        if stats:
            db_lines = [
                f"👥 Пользователей: <b>{stats.get('total_users', 'N/A')}</b>",
                f"📦 Заказов: <b>{stats.get('total_orders', 'N/A')}</b>",
            ]
    except Exception as e:
        db_lines = [f"🗄️ БД: ⚠️ {type(e).__name__}"]

    # AI stats
    ai_lines = [
        f"🤖 AI запросов: <b>{ai_metrics.total_questions}</b>",
        f"   Ответил AI: {ai_metrics.ai_answered} | Хэндофф: {ai_metrics.handoffs} | Ошибки: {ai_metrics.errors}",
        f"   Среднее время: {ai_metrics.avg_latency_ms}ms",
    ]

    text = (
        "📊 <b>СТАТИСТИКА</b>\n"
        "═══════════════════════\n\n"
        + "\n".join(db_lines + [""] + ai_lines)
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🤖 AI детали", callback_data="adm:ai_metrics"),
            InlineKeyboardButton(text="📋 AI лог", callback_data="adm:ai_recent"),
        ],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
    ])
    await callback.message.answer(text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()


# ═══════════════════════════════════════════════════════════════════
# 📋 Тикеты (open queue)
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:tickets")
async def adm_tickets(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return

    status_msg = await callback.message.answer("⏳ Загрузка тикетов...")
    await callback.answer()

    api = _api_base()
    if not api:
        await status_msg.edit_text("⚠️ Тикеты недоступны (SITE_URL не задан).")
        return

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{api}/api/admin/tickets",
                headers=_api_headers(),
                timeout=aiohttp.ClientTimeout(total=10),
            ) as res:
                data = await res.json()
    except Exception as e:
        await status_msg.edit_text(f"❌ Ошибка загрузки тикетов: {e}")
        return

    tickets = data if isinstance(data, list) else data.get("tickets", [])

    if not tickets:
        await status_msg.edit_text(
            "📭 <b>Нет открытых тикетов</b>\n\nВсе обращения обработаны.",
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
            ]),
        )
        return

    lines = [f"📋 <b>Открытые тикеты ({len(tickets)})</b>\n"]
    for t in tickets[:15]:
        tid = str(t.get("id", ""))[:8]
        status = t.get("status", "open")
        emoji = {"open": "🟡", "in_progress": "🔵", "answered": "✅", "closed": "⚫"}.get(status, "⚪")
        text_preview = (t.get("original_text", t.get("message", "")) or "")[:50]
        user = t.get("user_name", t.get("telegram_id", "?"))
        lines.append(f"{emoji} <code>{tid}</code> {user}: {text_preview}")

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
    ])
    await status_msg.edit_text("\n".join(lines), parse_mode="HTML", reply_markup=kb)


# ═══════════════════════════════════════════════════════════════════
# 🤖 AI Management
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:ai_menu")
async def adm_ai_menu(callback: CallbackQuery):
    if not _is_admin(callback.from_user.id):
        await callback.answer("Только для админов", show_alert=True)
        return

    status = "🟢 ВКЛ" if is_auto_respond() else "🔴 ВЫКЛ"
    text = (
        "🤖 <b>AI УПРАВЛЕНИЕ</b>\n"
        "═══════════════════════\n\n"
        f"Авто-ответ AI: <b>{status}</b>\n"
        f"Модель: <code>{OPENAI_MODEL}</code>\n"
        f"Провайдер: <code>{OPENAI_BASE_URL}</code>\n"
        f"Ключ: {'🔑 установлен' if OPENAI_API_KEY else '❌ не задан'}\n"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🔄 Переключить AI",
                callback_data="adm:ai_toggle",
            ),
            InlineKeyboardButton(
                text="🧪 Тест AI",
                callback_data="adm:ai_test",
            ),
        ],
        [
            InlineKeyboardButton(text="📊 Метрики", callback_data="adm:ai_metrics"),
            InlineKeyboardButton(text="📋 Лог запросов", callback_data="adm:ai_recent"),
        ],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
    ])
    await callback.message.answer(text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data == "adm:ai_toggle")
async def adm_ai_toggle(callback: CallbackQuery):
    if not _is_admin(callback.from_user.id):
        await callback.answer("Только для админов", show_alert=True)
        return

    new_val = not is_auto_respond()
    set_auto_respond(new_val)

    status = "🟢 ВКЛЮЧЁН" if new_val else "🔴 ВЫКЛЮЧЕН"
    await callback.answer(f"AI авто-ответ: {status}", show_alert=True)
    # Re-show menu
    await adm_ai_menu(callback)


@router.callback_query(F.data == "adm:ai_test")
async def adm_ai_test(callback: CallbackQuery):
    if not _is_admin(callback.from_user.id):
        await callback.answer("Только для админов", show_alert=True)
        return

    await callback.answer()
    status_msg = await callback.message.answer("🧪 <b>Тестирование AI...</b>", parse_mode="HTML")

    result = await test_ai()

    if result["ok"]:
        text = (
            "🟢 <b>AI ТЕСТ — УСПЕХ</b>\n"
            "═══════════════════════\n\n"
            f"Model endpoint: ✅ HTTP {result.get('models_endpoint', '?')}\n"
            f"Chat endpoint:  ✅ HTTP {result.get('chat_endpoint', '?')}\n"
            f"Модель: <code>{result.get('model', '?')}</code>\n"
            f"Задержка: <b>{result.get('latency_ms', '?')}ms</b>\n"
            f"Ответ: <i>{result.get('test_reply', '?')}</i>"
        )
    else:
        text = (
            "🔴 <b>AI ТЕСТ — ОШИБКА</b>\n"
            "═══════════════════════\n\n"
            f"Задержка: {result.get('latency_ms', '?')}ms\n"
            f"Ошибка: <code>{result.get('error', 'unknown')}</code>"
        )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 AI меню", callback_data="adm:ai_menu")],
    ])
    await status_msg.edit_text(text, parse_mode="HTML", reply_markup=kb)


@router.callback_query(F.data == "adm:ai_metrics")
async def adm_ai_metrics(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return

    text = get_metrics_text()
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📋 Лог запросов", callback_data="adm:ai_recent"),
            InlineKeyboardButton(text="🔙 Назад", callback_data="adm:ai_menu"),
        ],
    ])
    await callback.message.answer(text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data == "adm:ai_recent")
async def adm_ai_recent(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return

    text = get_recent_questions_text()
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Метрики", callback_data="adm:ai_metrics"),
            InlineKeyboardButton(text="🔙 Назад", callback_data="adm:ai_menu"),
        ],
    ])
    await callback.message.answer(text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()


# ═══════════════════════════════════════════════════════════════════
# 🔍 Диагностика (/debug — full version)
# ═══════════════════════════════════════════════════════════════════

@router.message(Command("debug"))
async def cmd_debug(message: Message):
    if not _is_operator(message.from_user.id):
        return
    await _show_debug_menu(message)


@router.callback_query(F.data == "adm:debug")
async def adm_debug(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return
    await callback.answer()
    await _show_debug_menu(callback.message)


async def _show_debug_menu(target: Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚡ Полная диагностика", callback_data="dbg:full")],
        [
            InlineKeyboardButton(text="🌐 Проверить веб-сервер", callback_data="dbg:web"),
            InlineKeyboardButton(text="🗄️ Проверить БД", callback_data="dbg:db"),
        ],
        [
            InlineKeyboardButton(text="🤖 Тест AI", callback_data="dbg:ai"),
            InlineKeyboardButton(text="📥 Проверить API", callback_data="dbg:api"),
        ],
        [
            InlineKeyboardButton(text="⚙️ Проверить конфиг", callback_data="dbg:config"),
            InlineKeyboardButton(text="📊 Ресурсы", callback_data="dbg:resources"),
        ],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
    ])
    text = (
        "🔍 <b>ДИАГНОСТИКА СИСТЕМЫ</b>\n"
        "═══════════════════════\n\n"
        "Выберите проверку:"
    )
    await target.answer(text, parse_mode="HTML", reply_markup=kb)


@router.callback_query(F.data == "dbg:full")
async def dbg_full(callback: CallbackQuery):
    await callback.answer()
    status_msg = await callback.message.answer("⚙️ <b>Запуск полной диагностики...</b>", parse_mode="HTML")

    lines = []

    # 1. Web server
    api = _api_base()
    if api:
        t0 = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(api, timeout=aiohttp.ClientTimeout(total=5)) as res:
                    ms = round((time.time() - t0) * 1000)
                    lines.append(f"🌐 Веб-сервер: 🟢 ONLINE ({ms}ms) HTTP {res.status}")
        except Exception as e:
            lines.append(f"🌐 Веб-сервер: 🔴 OFFLINE — {type(e).__name__}")
    else:
        lines.append("🌐 Веб-сервер: ⚪ SITE_URL не задан")

    # 2. Database
    try:
        from database.connection import async_session_factory
        if async_session_factory:
            async with async_session_factory() as session:
                from sqlalchemy import text as sa_text
                result = await session.execute(sa_text("SELECT 1"))
                await session.commit()
            lines.append("🗄️ БД: 🟢 подключена (SELECT 1 OK)")
        else:
            lines.append("🗄️ БД: ⚪ не инициализирована (нет DATABASE_URL)")
    except Exception as e:
        lines.append(f"🗄️ БД: 🔴 {type(e).__name__}: {str(e)[:80]}")

    # 3. AI (quick test)
    if OPENAI_API_KEY:
        ai_result = await test_ai()
        if ai_result["ok"]:
            lines.append(f"🤖 AI: 🟢 OK ({ai_result.get('latency_ms', '?')}ms) модель: {OPENAI_MODEL}")
        else:
            lines.append(f"🤖 AI: 🔴 {ai_result.get('error', 'unknown')[:80]}")
    else:
        lines.append("🤖 AI: ⚪ ключ не задан")

    # 4. API endpoints
    if api:
        endpoints = [
            ("Тикеты", "/api/tickets/history?telegramId=0"),
            ("Товары", "/api/products"),
            ("Статистика (public)", "/api/debug/stats"),
        ]
        for name, path in endpoints:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{api}{path}",
                        headers=_api_headers(),
                        timeout=aiohttp.ClientTimeout(total=5),
                    ) as res:
                        if res.status < 500:
                            lines.append(f"📥 API {name}: 🟢 HTTP {res.status}")
                        else:
                            lines.append(f"📥 API {name}: 🟡 HTTP {res.status}")
            except Exception as e:
                lines.append(f"📥 API {name}: 🔴 {type(e).__name__}")
    else:
        lines.append("📥 API: ⚪ пропущен (нет SITE_URL)")

    # 5. Config check
    required = {"BOT_TOKEN": BOT_TOKEN, "DATABASE_URL": DATABASE_URL}
    missing = [k for k, v in required.items() if not v]
    if not missing:
        lines.append("⚙️ Конфиг: 🟢 все обязательные vars заданы")
    else:
        lines.append(f"⚙️ Конфиг: 🔴 не заданы: {', '.join(missing)}")

    # 6. Resources
    import resource
    try:
        rusage = resource.getrusage(resource.RUSAGE_SELF)
        mem_mb = round(rusage.ru_maxrss / 1024, 1)
        lines.append(f"📊 Память: {mem_mb}MB | Аптайм: {_uptime()}")
    except Exception:
        lines.append(f"📊 Аптайм: {_uptime()}")

    report = (
        "📋 <b>ПОЛНЫЙ ОТЧЁТ ДИАГНОСТИКИ</b>\n"
        "═══════════════════════════════\n\n"
        + "\n".join(lines)
        + f"\n\n{'═' * 30}\n"
        f"👥 Операторов: {len(ALL_OPERATOR_IDS)} | "
        f"Время: {_now()}"
    )
    await status_msg.edit_text(report, parse_mode="HTML")


@router.callback_query(F.data == "dbg:web")
async def dbg_web(callback: CallbackQuery):
    await callback.answer()
    api = _api_base()
    if not api:
        await callback.message.answer("⚪ <code>SITE_URL</code> не задан в переменных.", parse_mode="HTML")
        return

    t0 = time.time()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(api, timeout=aiohttp.ClientTimeout(total=10)) as res:
                ms = round((time.time() - t0) * 1000)
                body_len = len(await res.read())
                await callback.message.answer(
                    f"🌐 <b>Веб-сервер</b>\n\n"
                    f"Статус: {'🟢 ONLINE' if res.status < 500 else '🟡 PARTIAL'}\n"
                    f"HTTP: <code>{res.status}</code>\n"
                    f"Задержка: <b>{ms}ms</b>\n"
                    f"Размер ответа: {body_len:,} байт\n"
                    f"URL: <code>{api}</code>",
                    parse_mode="HTML",
                )
    except Exception as e:
        await callback.message.answer(
            f"🌐 <b>Веб-сервер</b>\n\n🔴 OFFLINE\n"
            f"<code>{type(e).__name__}: {e}</code>",
            parse_mode="HTML",
        )


@router.callback_query(F.data == "dbg:db")
async def dbg_db(callback: CallbackQuery):
    await callback.answer()
    status_msg = await callback.message.answer("⏳ Проверка БД...", parse_mode="HTML")

    if not DATABASE_URL:
        await status_msg.edit_text("🗄️ <b>БД</b>\n\n⚪ DATABASE_URL не задан", parse_mode="HTML")
        return

    try:
        from database.connection import async_session_factory
        from sqlalchemy import text as sa_text

        async with async_session_factory() as session:
            # Test connection
            t0 = time.time()
            await session.execute(sa_text("SELECT 1"))
            ms = round((time.time() - t0) * 1000)

            # Count tables
            tables_result = await session.execute(sa_text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            ))
            tables = [row[0] for row in tables_result.fetchall()]

            # Count users
            try:
                count_result = await session.execute(sa_text("SELECT COUNT(*) FROM users"))
                user_count = count_result.scalar()
            except Exception:
                user_count = "?"

            await session.commit()

        text = (
            f"🗄️ <b>БАЗА ДАННЫХ</b>\n\n"
            f"Статус: 🟢 подключена\n"
            f"Пинг: <b>{ms}ms</b>\n"
            f"Префикс: <code>{DATABASE_URL[:50]}...</code>\n\n"
            f"Таблицы ({len(tables)}): <code>{', '.join(tables[:10])}</code>\n"
            f"Пользователей: <b>{user_count}</b>"
        )
    except Exception as e:
        text = (
            f"🗄️ <b>БАЗА ДАННЫХ</b>\n\n"
            f"🔴 Ошибка подключения\n"
            f"<code>{type(e).__name__}: {str(e)[:200]}</code>"
        )

    await status_msg.edit_text(text, parse_mode="HTML")


@router.callback_query(F.data == "dbg:ai")
async def dbg_ai(callback: CallbackQuery):
    await callback.answer()
    if not OPENAI_API_KEY:
        await callback.message.answer("🤖 AI: ⚪ OPENAI_API_KEY не задан", parse_mode="HTML")
        return

    status_msg = await callback.message.answer("🧪 <b>Тестирование AI...</b>", parse_mode="HTML")
    result = await test_ai()

    if result["ok"]:
        text = (
            f"🤖 <b>AI ТЕСТ</b>\n\n"
            f"Статус: 🟢 <b>РАБОТАЕТ</b>\n"
            f"Models API: HTTP {result.get('models_endpoint', '?')}\n"
            f"Chat API: HTTP {result.get('chat_endpoint', '?')}\n"
            f"Модель: <code>{result.get('model', '?')}</code>\n"
            f"Задержка: <b>{result.get('latency_ms', '?')}ms</b>\n"
            f"Тестовый ответ: <i>{result.get('test_reply', '?')}</i>"
        )
    else:
        text = (
            f"🤖 <b>AI ТЕСТ</b>\n\n"
            f"Статус: 🔴 <b>ОШИБКА</b>\n"
            f"Задержка: {result.get('latency_ms', '?')}ms\n"
            f"<code>{result.get('error', 'unknown')}</code>"
        )
    await status_msg.edit_text(text, parse_mode="HTML")


@router.callback_query(F.data == "dbg:api")
async def dbg_api(callback: CallbackQuery):
    await callback.answer()
    api = _api_base()
    if not api:
        await callback.message.answer("📥 API: ⚪ SITE_URL не задан", parse_mode="HTML")
        return

    status_msg = await callback.message.answer("📥 <b>Проверка API эндпоинтов...</b>", parse_mode="HTML")

    endpoints = [
        ("Главная", "/"),
        ("Товары", "/api/products"),
        ("Тикеты API", "/api/tickets/history?telegramId=0"),
        ("Статистика", "/api/debug/stats"),
    ]

    lines = []
    for name, path in endpoints:
        t0 = time.time()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{api}{path}",
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as res:
                    ms = round((time.time() - t0) * 1000)
                    emoji = "🟢" if res.status < 400 else ("🟡" if res.status < 500 else "🔴")
                    lines.append(f"{emoji} {name}: HTTP {res.status} ({ms}ms)")
        except Exception as e:
            ms = round((time.time() - t0) * 1000)
            lines.append(f"🔴 {name}: {type(e).__name__} ({ms}ms)")

    text = (
        "📥 <b>API ЭНДПОИНТЫ</b>\n\n" + "\n".join(lines) +
        f"\n\nURL: <code>{api}</code>"
    )
    await status_msg.edit_text(text, parse_mode="HTML")


@router.callback_query(F.data == "dbg:config")
async def dbg_config(callback: CallbackQuery):
    await callback.answer()

    checks = [
        ("BOT_TOKEN", BOT_TOKEN, True, "***" + BOT_TOKEN[-4:] if len(BOT_TOKEN) > 8 else ""),
        ("DATABASE_URL", DATABASE_URL, True, DATABASE_URL[:30] + "..." if DATABASE_URL else ""),
        ("OPENAI_API_KEY", OPENAI_API_KEY, False, "установлен" if OPENAI_API_KEY else "не задан"),
        ("OPENAI_MODEL", OPENAI_MODEL, False, OPENAI_MODEL),
        ("OPENAI_BASE_URL", OPENAI_BASE_URL, False, OPENAI_BASE_URL[:50] if OPENAI_BASE_URL else "авто"),
        ("SITE_URL", SITE_URL, False, SITE_URL or "не задан"),
        ("SUPPORT_MINIAPP_URL", SUPPORT_MINIAPP_URL, False, "задан" if SUPPORT_MINIAPP_URL else "не задан"),
        ("ADMIN_IDS", str(ADMIN_IDS), False, f"{len(ADMIN_IDS)} ID"),
        ("SUPPORT_CHAT_IDS", str(SUPPORT_CHAT_IDS), False, f"{len(SUPPORT_CHAT_IDS)} ID"),
    ]

    lines = []
    for name, value, required, display in checks:
        if required and not value:
            emoji = "🔴"
        elif value:
            emoji = "🟢"
        else:
            emoji = "⚪"
        lines.append(f"{emoji} <code>{name}</code> = {display}")

    # System info
    lines.append(f"\n🐍 Python: {sys.version.split()[0]}")
    lines.append(f"📦 aiogram: 3.x")

    text = (
        "⚙️ <b>КОНФИГУРАЦИЯ</b>\n"
        "═══════════════════════\n\n"
        + "\n".join(lines)
    )
    await callback.message.answer(text, parse_mode="HTML")


@router.callback_query(F.data == "dbg:resources")
async def dbg_resources(callback: CallbackQuery):
    await callback.answer()

    lines = [f"⏱️ Аптайм: <b>{_uptime()}</b>"]

    try:
        import resource
        rusage = resource.getrusage(resource.RUSAGE_SELF)
        lines.append(f"💾 Память (max RSS): <b>{round(rusage.ru_maxrss / 1024, 1)} MB</b>")
        lines.append(f"⏳ CPU time (user): {rusage.ru_utime:.1f}s")
        lines.append(f"⏳ CPU time (sys): {rusage.ru_stime:.1f}s")
    except Exception:
        pass

    # Process info
    try:
        import asyncio
        lines.append(f"🔄 Активных задач: {len(asyncio.all_tasks())}")
    except Exception:
        pass

    text = (
        "📊 <b>РЕСУРСЫ СИСТЕМЫ</b>\n"
        "═══════════════════════\n\n"
        + "\n".join(lines)
    )
    await callback.message.answer(text, parse_mode="HTML")


# ═══════════════════════════════════════════════════════════════════
# 📢 Рассылка
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:broadcast")
async def adm_broadcast(callback: CallbackQuery):
    if not _is_admin(callback.from_user.id):
        await callback.answer("Только для админов", show_alert=True)
        return

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✏️ Написать текст", callback_data="bcast:start"),
        ],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="adm:back")],
    ])
    await callback.message.answer(
        "📢 <b>РАССЫЛКА</b>\n\n"
        "Отправить сообщение всем пользователям бота.\n"
        "Будет запрошен текст для отправки.",
        parse_mode="HTML", reply_markup=kb,
    )
    await callback.answer()


@router.callback_query(F.data == "bcast:start")
async def bcast_start(callback: CallbackQuery, state: FSMContext):
    if not _is_admin(callback.from_user.id):
        return
    await state.set_state(BroadcastStates.waiting_broadcast_text)
    await callback.message.answer(
        "✍️ <b>Введите текст рассылки</b>\n\n"
        "Отправьте текст следующим сообщением.\n"
        "Для отмены: /start",
        parse_mode="HTML",
    )
    await callback.answer()


@router.message(BroadcastStates.waiting_broadcast_text)
async def bcast_send(message: Message, state: FSMContext, bot: Bot):
    if not _is_admin(message.from_user.id):
        await state.clear()
        return

    text = message.text or message.caption or ""
    if not text:
        await message.answer("⚠️ Отправьте текстовое сообщение.")
        return

    await state.clear()
    status_msg = await message.answer("⏳ <b>Рассылка...</b>", parse_mode="HTML")

    # Get all users from DB
    try:
        from database import get_all_users
        users = await get_all_users()
    except Exception as e:
        await status_msg.edit_text(f"❌ Ошибка получения пользователей: {e}")
        return

    if not users:
        await status_msg.edit_text("📭 Нет пользователей для рассылки.")
        return

    sent = 0
    failed = 0
    for user in users:
        uid = user.get("telegram_id")
        if not uid:
            continue
        try:
            await bot.send_message(
                chat_id=uid,
                text=f"📢 <b>SOULDAWN</b>\n\n{text}",
                parse_mode="HTML",
            )
            sent += 1
        except Exception:
            failed += 1
        # Rate limit
        await asyncio.sleep(0.05)

    await status_msg.edit_text(
        f"📢 <b>Рассылка завершена</b>\n\n"
        f"✅ Отправлено: <b>{sent}</b>\n"
        f"❌ Ошибок: <b>{failed}</b>\n"
        f"📊 Всего: {sent + failed}",
        parse_mode="HTML",
    )


# ═══════════════════════════════════════════════════════════════════
# ⚙️ Config page (read-only)
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:config")
async def adm_config_page(callback: CallbackQuery):
    if not _is_operator(callback.from_user.id):
        await callback.answer("Нет доступа", show_alert=True)
        return
    # Reuse debug config
    await dbg_config(callback)


# ═══════════════════════════════════════════════════════════════════
# Navigation
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "adm:back")
async def adm_back(callback: CallbackQuery):
    await callback.answer()
    await _show_admin_menu(callback)