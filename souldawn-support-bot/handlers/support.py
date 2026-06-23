"""SOULDAWN Support Bot — Fully Synced Omni-Channel Handler."""
from __future__ import annotations
import asyncio
import logging
import aiohttp
from aiogram import Router, F, Bot
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import CommandStart

from config import OPENAI_API_KEY, SUPPORT_CHAT_IDS, SUPPORT_MINIAPP_URL

router = Router()
logger = logging.getLogger("SOULDAWN.support")

API_BASE = "https://railway.app"

@router.message(CommandStart())
async def cmd_start_support(message: Message):
    welcome_text = (
        "👋 <b>Добро пожаловать в службу поддержки SOULDAWN!</b>\n\n"
        "Напишите ваш вопрос прямо сюда, и наша единая синхронная система поддержки моментально свяжет вас с оператором и ИИ."
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📱 Открыть окно поддержки", web_app=WebAppInfo(url=SUPPORT_MINIAPP_URL))],
        [InlineKeyboardButton(text="💬 Позвать оператора в чат", callback_data="ticket:call_operator")]
    ])
    await message.answer(welcome_text, parse_mode="HTML", reply_markup=kb)

@router.message(F.text & ~F.text.startswith("/"))
async def handle_support_message(message: Message, bot: Bot):
    # Синхронизируем текстовое сообщение ТГ с единой базой через API Next.js
    tg_id = str(message.from_user.id)
    text = message.text

    async with aiohttp.ClientSession() as session:
        # Проверяем, есть ли активный тикет, чтобы дописать сообщение или создать новый
        async with session.get(f"{API_BASE}/history?telegramId={tg_id}") as res:
            history_data = await res.json()
            tickets = history_data.get("tickets", [])
            open_ticket = next((t for t in tickets if t.get("status") == "open"), None)

        if open_ticket:
            # Если диалог уже идет, добавляем реплику в real-time чат
            payload = {"ticketId": open_ticket["id"], "sender": "user", "text": text}
            async with session.post(f"{API_BASE}/messages", json=payload) as msg_res:
                pass
            ticket_id = open_ticket["id"]
        else:
            # Если это первое сообщение, создаем тикет на бэкенде
            payload = {"telegramId": tg_id, "category": "general", "message": text}
            async with session.post(f"{API_BASE}/create", json=payload) as create_res:
                create_data = await create_res.json()
                ticket_id = create_data.get("ticketId", "unknown")

    # Отправляем красивую карточку тикета операторам с кнопкой ответа
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
        except Exception as e:
            logger.warning(f"Failed to notify operator {op_id}: {e}")
