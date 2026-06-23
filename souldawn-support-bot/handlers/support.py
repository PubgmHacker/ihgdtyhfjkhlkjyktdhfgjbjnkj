"""SOULDAWN Support Bot — Fully Unified Synchronized Omni-Channel Handler."""
from __future__ import annotations
import asyncio
import logging
import random
import os
import aiohttp
from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from config import OPENAI_API_KEY, SUPPORT_CHAT_IDS, SUPPORT_MINIAPP_URL, ADMIN_IDS

router = Router()
logger = logging.getLogger("SOULDAWN.support")

class ReplyStates(StatesGroup):
    waiting_for_reply_text = State()

RAW_URL = os.getenv("MINIAPP_URL", "https://railway.app")
API_BASE = RAW_URL.rstrip("/") + "/api/tickets"

# ── /start РАЗДЕЛЕНИЕ РОЛЕЙ ──
@router.message(CommandStart())
async def cmd_start_support(message: Message):
    user_id = message.from_user.id
    if user_id in SUPPORT_CHAT_IDS or user_id in getattr(message.bot, "admin_ids", ADMIN_IDS):
        admin_text = (
            "🖥️ <b>Добро пожаловать в Админ-Панель оператора SOULDAWN!</b>\n\n"
            "Вы авторизованы как менеджер службы поддержки. Обращения клиентов с сайта и из бота будут прилетать вам в этот чат."
        )
        admin_url = RAW_URL.rstrip("/") + "/admin"
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⚙️ Открыть Панель Ответов (Mini App)", web_app=WebAppInfo(url=admin_url))],
            [InlineKeyboardButton(text="🛠️ Запустить Дебаг-Меню для тестов", callback_data="admin:debug_menu")]
        ])
        await message.answer(admin_text, parse_mode="HTML", reply_markup=kb)
        return

    welcome_text = (
        "👋 <b>Добро пожаловать в службу поддержки SOULDAWN!</b>\n\n"
        "Напишите ваш вопрос прямо сюда, и наша единая синхронная система поддержки моментально свяжет вас с оператором и ИИ."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Открыть окно поддержки", web_app=WebAppInfo(url=SUPPORT_MINIAPP_URL))]
    ])
    await message.answer(welcome_text, parse_mode="HTML", reply_markup=kb)

# ── ПОЛНОЕ ИСПРАВЛЕННОЕ ДЕБАГ-МЕНЮ (/debug И КНОПКА) ──
@router.message(Command("debug"))
@router.callback_query(F.data == "admin:debug_menu")
async def call_debug_menu_click(event: Message | CallbackQuery):
    message = event if isinstance(event, Message) else event.message
    debug_text = "🛠️ <b>SOULDAWN SUPPORT · ИЗОЛИРОВАННАЯ ДЕБАГ-ПАНЕЛЬ</b>\n\nВыберите действие для генерации сквозных тестов:"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📥 Имитировать обращение с сайта", callback_data="debug:simulate_web")],
        [InlineKeyboardButton(text="🤖 Имитировать обращение с ТГ-бота", callback_data="debug:simulate_tg")],
        [InlineKeyboardButton(text="🔄 Проверить статус БД (SELECT 1)", callback_data="debug:test_db")]
    ])
    if isinstance(event, CallbackQuery):
        await message.answer(debug_text, parse_mode="HTML", reply_markup=kb)
        await event.answer()
    else:
        await message.answer(debug_text, parse_mode="HTML", reply_markup=kb)

# ── ИМИТАЦИЯ ОБРАЩЕНИЯ С САЙТА ──
@router.callback_query(F.data == "debug:simulate_web")
async def simulate_web_ticket(callback: CallbackQuery):
    fake_id = str(random.randint(100000, 999999))
    async with aiohttp.ClientSession() as session:
        payload = {"telegramId": "8340654471", "category": "order", "message": "Тестовый запрос с сайта #" + fake_id}
        await session.post(RAW_URL.rstrip("/") + "/api/tickets/create", json=payload)
    await callback.message.answer("✅ Имитация обращения с сайта выполнена через API!", parse_mode="HTML")
    await callback.answer()

# ── ИМИТАЦИЯ ОБРАЩЕНИЯ С ТГ-БОТА ──
@router.callback_query(F.data == "debug:simulate_tg")
async def simulate_tg_ticket(callback: CallbackQuery):
    fake_id = str(random.randint(100000, 999999))
    notification_text = "❓ <b>Новое обращение в поддержку!</b>\n\n<b>Источник:</b> Telegram-Бот (Имитация)\n<b>ID тикета:</b> <code>tg_" + fake_id + "</code>\n\n<b>Текст:</b> <i>Тестовый вопрос напрямую из чата ТГ-бота</i>"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💬 Ответить пользователю", callback_data="ticket:reply:tg_" + fake_id)]
    ])
    await callback.message.answer(notification_text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()

# ── ПРОВЕРКА СТАТУСА БАЗЫ ДАННЫХ ──
@router.callback_query(F.data == "debug:test_db")
async def test_db_connection(callback: CallbackQuery):
    async with aiohttp.ClientSession() as session:
        async with session.get(API_BASE + "/history?telegramId=8340654471") as res:
            status = "SUCCESS ✅" if res.status == 200 else "ERROR ❌"
            await callback.message.answer("🔄 <b>Статус подключения к бэкенду БД:</b> " + status, parse_mode="HTML")
    await callback.answer()

# ── ОБРАБОТКА ИНЛАЙН-КНОПКИ "ОТВЕТИТЬ ПОЛЬЗОВАТЕЛЮ" ──
@router.callback_query(F.data.startswith("ticket:reply:"))
async def handle_operator_reply_click(callback: CallbackQuery, state: FSMContext):
    ticket_id = callback.data.split(":")[-1]
    await state.update_data(ticket_id=ticket_id)
    await state.set_state(ReplyStates.waiting_for_reply_text)
    await callback.message.answer(f"✍️ <b>Введите текст ответа для тикета</b> <code>{ticket_id}</code>:", parse_mode="HTML")
    await callback.answer()

@router.message(ReplyStates.waiting_for_reply_text)
async def process_operator_reply_text(message: Message, state: FSMContext):
    state_data = await state.get_data()
    ticket_id = state_data["ticket_id"]
    text = message.text
    await state.clear()

    async with aiohttp.ClientSession() as session:
        payload = {"ticketId": ticket_id, "sender": "operator", "text": text}
        await session.post(RAW_URL.rstrip("/") + "/api/tickets/messages", json=payload)
        await session.post(RAW_URL.rstrip("/") + "/api/admin/tickets/" + str(ticket_id) + "/reply", json={"reply": text})

    await message.answer("✅ <b>Ответ успешно отправлен и заархивирован везде!</b>", parse_mode="HTML")

# ── ОБРАБОТКА ОБЫЧНЫХ СООБЩЕНИЙ КЛИЕНТОВ (МТС-СТАЙЛ) ──
@router.message(F.text & ~F.text.startswith("/"))
async def handle_support_message(message: Message, bot: Bot):
    tg_id = str(message.from_user.id)
    text = message.text

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE}/history?telegramId={tg_id}") as res:
            history_data = await res.json()
            tickets = history_data.get("tickets", [])
            open_ticket = next((t for t in tickets if t.get("status") == "open"), None)

        if open_ticket:
            payload = {"ticketId": open_ticket["id"], "sender": "user", "text": text}
            async with session.post(f"{API_BASE}/messages", json=payload): pass
            ticket_id = open_ticket["id"]
        else:
            payload = {"telegramId": tg_id, "category": "general", "message": text}
            async with session.post(f"{API_BASE}/create", json=payload) as create_res:
                create_data = await create_res.json()
                ticket_id = create_data.get("ticketId", "unknown")

    notification_text = (
        f"❓ <b>Новое обращение в поддержку!</b>\n\n"
        f"<b>Источник:</b> Telegram-Бот\n"
        f"<b>Пользователь:</b> @{message.from_user.username or '—'}\n"
        f"<b>ID тикета:</b> <code>{ticket_id}</code>\n\n"
        f"<b>Текст:</b> <i>{text}</i>"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💬 Ответить пользователю", callback_data=f"ticket:reply:{ticket_id}")]
    ])
    for op_id in SUPPORT_CHAT_IDS:
        try:
            await bot.send_message(chat_id=op_id, text=notification_text, parse_mode="HTML", reply_markup=kb)
            await asyncio.sleep(0.05)
        except Exception: pass
