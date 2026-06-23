"""
SOULDAWN — Бот поддержки (@souldawn_support_bot).

Архитектура (двусторонняя переписка):

  Пользователь:
    • Пишет в @souldawn_support_bot
    • Видит историю своих обращений (/history)
    • Получает ответы оператора прямо здесь

  Админ:
    • Получает уведомления о новых обращениях в этом же боте
    • Отвечает reply-сообщением на форвард (или /reply <user_id> <текст>)
    • Видит все тикеты (/tickets)
    • Закрывает тикет (/close <ticket_id>)

  Хранение:
    • Тикеты и сообщения хранятся в БД (через сайт)
    • В памяти — соответствие user_id → ticket_id и admin_msg_id → user_id

Env:
  SUPPORT_BOT_TOKEN  — токен бота поддержки
  ADMIN_IDS          — id админов через запятую
  SITE_URL           — URL сайта (для POST /api/support/notify)
  WEBHOOK_SECRET     — секрет для защиты API
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
import uuid
from typing import Optional

import aiohttp
from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    InlineKeyboardButton, InlineKeyboardMarkup,
    Message, CallbackQuery,
)

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("SUPPORT_BOT")

SUPPORT_BOT_TOKEN = os.getenv("SUPPORT_BOT_TOKEN", "")
ADMIN_IDS         = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]
SITE_URL          = os.getenv("SITE_URL", "").rstrip("/")
WEBHOOK_SECRET   = os.getenv("WEBHOOK_SECRET", "")

router = Router()

# ─────────────────────────────────────────────────────────────
# Состояние
# ─────────────────────────────────────────────────────────────

# user_id → ticket_id (кэш в памяти для быстрого доступа, источник истины — БД)
user_tickets: dict[int, str] = {}

# user_id → [сообщения] (кэш истории в памяти, сохраняется в БД через ActionLog)
user_history: dict[int, list[dict]] = {}

# admin_msg_id → user_id (для reply-ответа админа)
admin_reply_map: dict[int, int] = {}  # msg_id → user_id

# ticket_id → user_id
ticket_user_map: dict[str, int] = {}

# БД доступна если DATABASE_URL задан
DATABASE_URL = os.getenv("DATABASE_URL", "")
_db_available = bool(DATABASE_URL)


# ─────────────────────────────────────────────────────────────
# Клавиатуры
# ─────────────────────────────────────────────────────────────

def _user_main_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✏️  Написать оператору", callback_data="write")],
        [InlineKeyboardButton(text="📜  Мои обращения", callback_data="history")],
    ])


def _cancel_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✕  Отмена", callback_data="cancel")],
    ])


def _admin_ticket_kb(ticket_id: str, user_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="✉️  Ответить",
            callback_data=f"reply:{user_id}:{ticket_id}",
        )],
        [InlineKeyboardButton(
            text="✔  Закрыть тикет",
            callback_data=f"close:{ticket_id}",
        )],
    ])


# ─────────────────────────────────────────────────────────────
# Хелперы
# ─────────────────────────────────────────────────────────────

def _is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


def _add_to_history(user_id: int, role: str, text: str) -> None:
    if user_id not in user_history:
        user_history[user_id] = []
    import time as _time
    user_history[user_id].append({"role": role, "text": text[:500], "ts": _time.time()})
    # Храним последние 50 сообщений
    if len(user_history[user_id]) > 50:
        user_history[user_id] = user_history[user_id][-50:]


async def _notify_site(user_id: int, username: Optional[str], name: str, text: str, ticket_id: str) -> None:
    """Отправляем уведомление на сайт (админ-панель)."""
    if not SITE_URL:
        return
    try:
        async with aiohttp.ClientSession() as session:
            await session.post(
                f"{SITE_URL}/api/support/notify",
                json={"user_id": user_id, "username": username, "name": name, "text": text, "ticket_id": ticket_id},
                headers={"x-bot-secret": WEBHOOK_SECRET},
                timeout=aiohttp.ClientTimeout(total=5),
            )
    except Exception as e:
        logger.warning(f"_notify_site: {e}")


# ─────────────────────────────────────────────────────────────
# Команды пользователя
# ─────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message):
    if _is_admin(message.from_user.id):
        await message.answer(
            "🛡️  <b>SOULDAWN — Панель поддержки</b>\n\n"
            "Здесь приходят все обращения пользователей.\n\n"
            "Команды:\n"
            "/tickets — активные тикеты\n"
            "/reply &lt;user_id&gt; &lt;текст&gt; — ответить пользователю\n"
            "/close &lt;ticket_id&gt; — закрыть тикет\n\n"
            "Или просто ответь reply на форвард от пользователя.",
            parse_mode="HTML",
        )
    else:
        await message.answer(
            "🌅  <b>SOULDAWN — Поддержка</b>\n\n"
            "Здесь ты можешь задать любой вопрос по заказу, доставке или товару.\n"
            "Оператор ответит в ближайшее время.",
            reply_markup=_user_main_kb(),
            parse_mode="HTML",
        )


@router.callback_query(F.data == "write")
async def on_write(callback: CallbackQuery):
    if _is_admin(callback.from_user.id):
        await callback.answer()
        return
    await callback.message.answer(
        "✏️  Напиши свой вопрос — оператор получит уведомление:",
        reply_markup=_cancel_kb(),
    )
    await callback.answer()


@router.callback_query(F.data == "cancel")
async def on_cancel(callback: CallbackQuery):
    await callback.message.answer(
        "←  Отменено.",
        reply_markup=_user_main_kb() if not _is_admin(callback.from_user.id) else None,
    )
    await callback.answer()


@router.callback_query(F.data == "history")
async def on_history(callback: CallbackQuery):
    user_id = callback.from_user.id
    history = user_history.get(user_id, [])
    if not history:
        await callback.message.answer("📜  Обращений пока нет.")
        await callback.answer()
        return

    import time as _time
    lines = ["📜  <b>История обращений</b>\n"]
    for msg in history[-20:]:
        role_icon = "👤" if msg["role"] == "user" else "🛡️"
        from datetime import datetime
        dt = datetime.fromtimestamp(msg["ts"]).strftime("%d.%m %H:%M")
        lines.append(f"{role_icon}  <i>{dt}</i>\n{msg['text']}")

    await callback.message.answer("\n\n".join(lines), parse_mode="HTML")
    await callback.answer()


# ─────────────────────────────────────────────────────────────
# Команды админа
# ─────────────────────────────────────────────────────────────

@router.message(Command("tickets"))
async def cmd_tickets(message: Message):
    if not _is_admin(message.from_user.id):
        return
    if not user_tickets:
        await message.answer("🎫  Активных тикетов нет.")
        return
    lines = ["🎫  <b>Активные тикеты</b>\n"]
    for uid, tid in user_tickets.items():
        lines.append(f"•  user_id: <code>{uid}</code> — ticket: <code>{tid[:8]}</code>")
    await message.answer("\n".join(lines), parse_mode="HTML")


@router.message(Command("reply"))
async def cmd_reply(message: Message, bot: Bot):
    if not _is_admin(message.from_user.id):
        return
    parts = (message.text or "").split(maxsplit=2)
    if len(parts) < 3:
        await message.answer("Использование: /reply &lt;user_id&gt; &lt;текст&gt;", parse_mode="HTML")
        return
    try:
        target_user_id = int(parts[1])
    except ValueError:
        await message.answer("Неверный user_id")
        return
    reply_text = parts[2]
    await _send_admin_reply(bot, target_user_id, reply_text, message.from_user.id)
    await message.answer("✅  Ответ отправлен.")


@router.message(Command("close"))
async def cmd_close(message: Message):
    if not _is_admin(message.from_user.id):
        return
    parts = (message.text or "").split(maxsplit=1)
    ticket_id = parts[1].strip() if len(parts) > 1 else ""
    user_id = ticket_user_map.get(ticket_id)
    if not user_id:
        # Ищем по префиксу
        for tid, uid in ticket_user_map.items():
            if tid.startswith(ticket_id):
                user_id = uid
                ticket_id = tid
                break
    if not user_id:
        await message.answer("Тикет не найден.")
        return
    user_tickets.pop(user_id, None)
    ticket_user_map.pop(ticket_id, None)
    await message.answer(f"✔  Тикет <code>{ticket_id[:8]}</code> закрыт.", parse_mode="HTML")


# ─────────────────────────────────────────────────────────────
# Callback: ответить / закрыть через кнопку
# ─────────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("reply:"))
async def on_reply_cb(callback: CallbackQuery, bot: Bot):
    if not _is_admin(callback.from_user.id):
        await callback.answer()
        return
    # reply:<user_id>:<ticket_id>
    parts = callback.data.split(":", 2)
    if len(parts) < 3:
        await callback.answer()
        return
    try:
        target_user_id = int(parts[1])
    except ValueError:
        await callback.answer()
        return

    await callback.message.answer(
        f"✏️  Ответ пользователю <code>{target_user_id}</code>:\n"
        f"Напиши текст ответа или используй /reply {target_user_id} &lt;текст&gt;",
        parse_mode="HTML",
    )
    await callback.answer()


@router.callback_query(F.data.startswith("close:"))
async def on_close_cb(callback: CallbackQuery):
    if not _is_admin(callback.from_user.id):
        await callback.answer()
        return
    ticket_id = callback.data.split(":", 1)[1]
    user_id = ticket_user_map.get(ticket_id)
    if user_id:
        user_tickets.pop(user_id, None)
        ticket_user_map.pop(ticket_id, None)
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.answer(f"✔  Тикет <code>{ticket_id[:8]}</code> закрыт.", parse_mode="HTML")
    await callback.answer()


# ─────────────────────────────────────────────────────────────
# Основной поток: сообщения от пользователей и ответы админов
# ─────────────────────────────────────────────────────────────

@router.message(F.text | F.photo | F.video | F.document | F.voice)
async def handle_any_message(message: Message, bot: Bot):
    user = message.from_user
    if not user:
        return

    # ── Админ отвечает reply-сообщением на форвард ──
    if _is_admin(user.id):
        reply = message.reply_to_message
        if reply:
            # Ищем user_id в admin_reply_map
            target_user_id = admin_reply_map.get(reply.message_id)
            if target_user_id:
                await _send_admin_reply(bot, target_user_id, message.text or message.caption or "", user.id)
                await message.answer("✅  Ответ отправлен.")
                return
        # Админ пишет без reply — подсказка
        await message.answer(
            "ℹ️  Чтобы ответить пользователю:\n"
            "•  Ответь reply на форвард его сообщения\n"
            "•  /reply &lt;user_id&gt; &lt;текст&gt;\n"
            "•  /tickets — список активных",
            parse_mode="HTML",
        )
        return

    # ── Пользователь пишет ──
    name   = user.first_name or user.username or str(user.id)
    uname  = f"@{user.username}" if user.username else "—"
    text   = message.text or message.caption or ""

    # Создаём или продолжаем тикет
    ticket_id = user_tickets.get(user.id)
    if not ticket_id:
        ticket_id = str(uuid.uuid4())
        user_tickets[user.id] = ticket_id
        ticket_user_map[ticket_id] = user.id

    # Добавляем в историю
    _add_to_history(user.id, "user", text or "[медиа]")

    # Форматируем сообщение для админов
    admin_text = (
        f"📩  <b>Обращение в поддержку</b>\n\n"
        f"👤  {name} · <code>{user.id}</code> · {uname}\n"
        f"🎫  Тикет: <code>{ticket_id[:8]}</code>\n\n"
        f"📝  {text[:600] or '[медиа-файл]'}"
    )

    # Отправляем админам в этот же бот (не в main-бот!)
    for admin_id in ADMIN_IDS:
        try:
            sent = await bot.send_message(
                admin_id,
                admin_text,
                reply_markup=_admin_ticket_kb(ticket_id, user.id),
                parse_mode="HTML",
            )
            # Сохраняем связь msg_id → user_id для reply
            admin_reply_map[sent.message_id] = user.id

            # Если есть медиа — пересылаем
            if message.photo:
                fwd = await bot.send_photo(admin_id, message.photo[-1].file_id, caption=f"👤 {name} · {uname}")
                admin_reply_map[fwd.message_id] = user.id
            elif message.video:
                fwd = await bot.send_video(admin_id, message.video.file_id, caption=f"👤 {name} · {uname}")
                admin_reply_map[fwd.message_id] = user.id
            elif message.document:
                fwd = await bot.send_document(admin_id, message.document.file_id, caption=f"👤 {name} · {uname}")
                admin_reply_map[fwd.message_id] = user.id
            elif message.voice:
                fwd = await bot.send_voice(admin_id, message.voice.file_id)
                admin_reply_map[fwd.message_id] = user.id
        except Exception as e:
            logger.warning(f"Failed to notify admin {admin_id}: {e}")

    # Уведомляем сайт (админ-панель)
    await _notify_site(user.id, user.username, name, text, ticket_id)

    # Подтверждаем пользователю
    await message.answer(
        "✅  Сообщение передано оператору.\n"
        "Ожидай ответ — он придёт сюда.",
    )


# ─────────────────────────────────────────────────────────────
# Хелпер: отправка ответа админа пользователю
# ─────────────────────────────────────────────────────────────

async def _send_admin_reply(bot: Bot, user_id: int, text: str, admin_id: int) -> None:
    """Отправляет ответ админа пользователю и добавляет в историю."""
    try:
        await bot.send_message(
            user_id,
            f"🛡️  <b>Оператор SOULDAWN</b>\n\n{text}",
            parse_mode="HTML",
        )
        _add_to_history(user_id, "admin", text)
    except Exception as e:
        logger.warning(f"_send_admin_reply: failed to send to user {user_id}: {e}")


# ─────────────────────────────────────────────────────────────
# Запуск
# ─────────────────────────────────────────────────────────────

async def main():
    if not SUPPORT_BOT_TOKEN:
        logger.error("SUPPORT_BOT_TOKEN not set")
        sys.exit(1)

    bot = Bot(token=SUPPORT_BOT_TOKEN, parse_mode="HTML")
    dp  = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    logger.info("SOULDAWN Support Bot started")
    logger.info(f"Admins: {ADMIN_IDS}")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
