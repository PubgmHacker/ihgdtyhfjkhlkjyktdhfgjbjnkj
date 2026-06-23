"""SOULDAWN Support Bot — Diagnostic Center & Omni-Channel Handler."""
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
BASE_URL = RAW_URL.rstrip("/") + "/"
API_BASE = BASE_URL + "api/tickets"

@router.message(CommandStart())
async def cmd_start_support(message: Message):
    user_id = message.from_user.id
    if user_id in SUPPORT_CHAT_IDS or user_id in ADMIN_IDS:
        admin_text = "🖥️ <b>Добро пожаловать в Админ-Панель оператора SOULDAWN!</b>\n\nВы авторизованы как менеджер службы поддержки. Обращения клиентов с сайта и из бота будут прилетать вам в этот чат."
        admin_url = BASE_URL + "admin"
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⚙️ Открыть Панель Ответов (Mini App)", web_app=WebAppInfo(url=admin_url))],
            [InlineKeyboardButton(text="🛠️ Запустить Дебаг-Меню для тестов", callback_data="admin:debug_menu")]
        ])
        await message.answer(admin_text, parse_mode="HTML", reply_markup=kb)
        return

    welcome_text = "👋 <b>Добро пожаловать в службу поддержки SOULDAWN!</b>\n\nНапишите ваш вопрос прямо сюда, и наша единая синхронная система поддержки моментально свяжет вас с оператором и ИИ."
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Открыть окно поддержки", web_app=WebAppInfo(url=SUPPORT_MINIAPP_URL))]
    ])
    await message.answer(welcome_text, parse_mode="HTML", reply_markup=kb)

@router.message(Command("debug"))
@router.callback_query(F.data == "admin:debug_menu")
async def call_debug_menu_click(event: Message | CallbackQuery):
    message = event if isinstance(event, Message) else event.message
    debug_text = "🛠️ <b>SOULDAWN SUPPORT · ГЛУБОКАЯ ДИАГНОСТИКА</b>\n\nВыберите нужный системный тест для проверки кодов ошибок бэкенда, маршрутизации и базы данных:"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📥 Тест 1: Имитировать чат с сайта", callback_data="debug:simulate_web")],
        [InlineKeyboardButton(text="🤖 Тест 2: Имитировать тикет из ТГ", callback_data="debug:simulate_tg")],
        [InlineKeyboardButton(text="🔍 Тест 3: Проверить роут History", callback_data="debug:test_history_api")],
        [InlineKeyboardButton(text="⚡ Тест 4: Прямой пинг API веба", callback_data="debug:ping_web_core")]
    ])
    if isinstance(event, CallbackQuery):
        await message.answer(debug_text, parse_mode="HTML", reply_markup=kb)
        await event.answer()
    else:
        await message.answer(debug_text, parse_mode="HTML", reply_markup=kb)

@router.callback_query(F.data == "debug:simulate_web")
async def simulate_web_ticket(callback: CallbackQuery):
    fake_id = str(random.randint(100000, 999999))
    target_url = BASE_URL + "api/tickets/create"
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        try:
            payload = {"telegramId": "8340654471", "category": "order", "message": "Дебаг-тест с сайта #" + fake_id}
            async with session.post(target_url, json=payload, timeout=5.0) as res:
                res_text = await res.text()
                if res.status == 200:
                    await callback.message.answer(f"✅ <b>Имитация сайта: 200 OK</b>\n<code>{res_text[:200]}</code>", parse_mode="HTML")
                else:
                    await callback.message.answer(f"❌ <b>Имитация сайта упала! Код {res.status}</b>\n<b>Ответ бэкенда:</b>\n<code>{res_text[:200]}</code>", parse_mode="HTML")
        except Exception as e:
            await callback.message.answer(f"🚨 <b>Сбой сети при имитации сайта:</b>\n<code>{str(e)}</code>", parse_mode="HTML")
    await callback.answer()

@router.callback_query(F.data == "debug:simulate_tg")
async def simulate_tg_ticket(callback: CallbackQuery):
    fake_id = str(random.randint(100000, 999999))
    notification_text = "❓ <b>Новое обращение в поддержку!</b>\n\n<b>Источник:</b> Telegram-Бот (Имитация)\n<b>ID тикета:</b> <code>tg_" + fake_id + "</code>\n\n<b>Текст:</b> <i>Тестовый вопрос напрямую из чата ТГ-бота</i>"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💬 Ответить пользователю", callback_data="ticket:reply:tg_" + fake_id)]
    ])
    await callback.message.answer(notification_text, parse_mode="HTML", reply_markup=kb)
    await callback.answer()

@router.callback_query(F.data == "debug:test_history_api")
async def test_history_api(callback: CallbackQuery):
    target_url = BASE_URL + "api/tickets/history?telegramId=8340654471"
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        try:
            async with session.get(target_url, timeout=5.0) as res:
                res_text = await res.text()
                if res.status == 200:
                    await callback.message.answer(f"🔄 <b>Статус подключения к бэкенду БД:</b> SUCCESS ✅ (Связь с сайтом установлена)\n<code>{res_text[:200]}</code>", parse_mode="HTML")
                else:
                    await callback.message.answer(f"❌ <b>History API выдал сбой! Код {res.status}</b>\n<b>Лог ошибки:</b>\n<code>{res_text[:200]}</code>", parse_mode="HTML")
        except Exception as e:
            await callback.message.answer(f"🚨 <b>Сбой подключения к History API:</b>\n<code>{str(e)}</code>", parse_mode="HTML")
    await callback.answer()

@router.callback_query(F.data == "debug:ping_web_core")
async def ping_web_core(callback: CallbackQuery):
    connector = aiohttp.TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        try:
            async with session.get(BASE_URL, timeout=4.0) as res:
                if res.status == 200:
                    await callback.message.answer("🟢 <b>Пинг веб-сервера: SUCCESS (Код 200)</b>\nКонтейнер Next.js запущен и успешно отдает страницы наружу.", parse_mode="HTML")
                else:
                    await callback.message.answer(f"🟡 <b>Пинг веб-сервера: СБОЙ (Код {res.status})</b>\nКонтейнер отвечает, но выдает ошибку. Проверьте логи сборки.", parse_mode="HTML")
        except Exception as e:
            await callback.message.answer(f"🔴 <b>Пинг веб-сервера: НЕ ДОСТУПЕН ❌</b>\nСайт полностью лежит или адрес указан неверно в Railway Variables.\n<b>Ошибка сети:</b> {str(e)}", parse_mode="HTML")
    await callback.answer()

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
        await session.post(BASE_URL + "api/tickets/messages", json=payload)
        await session.post(BASE_URL + "api/admin/tickets/" + str(ticket_id) + "/reply", json={"reply": text})
    await message.answer("✅ <b>Ответ успешно отправлен и заархивирован везде!</b>", parse_mode="HTML")

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
    notification_text = f"❓ <b>Новое обращение в поддержку!</b>\n\n<b>Источник:</b> Telegram-Бот\n<b>Пользователь:</b> @{message.from_user.username or '—'}\n<b>ID тикета:</b> <code>{ticket_id}</code>\n\n<b>Текст:</b> <i>{text}</i>"
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="💬 Ответить пользователю", callback_data=f"ticket:reply:{ticket_id}")]])
    for op_id in SUPPORT_CHAT_IDS:
        try: await bot.send_message(chat_id=op_id, text=notification_text, parse_mode="HTML", reply_markup=kb)
        except Exception: pass
