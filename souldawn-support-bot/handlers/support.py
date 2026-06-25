"""SOULDAWN Support Bot — Support handlers with AI-first flow.

Flow:
  1. User sends text → AI tries to answer
  2. If AI answers (not HANDOFF) → show answer + option to escalate
  3. If AI returns HANDOFF → create ticket to operators
  4. If AI is disabled or no key → direct to operators

Admin commands: /start (shows admin menu for operators), /tickets, /new
"""
from __future__ import annotations

import logging

import aiohttp
from aiogram import Router, F, Bot
from aiogram.types import (
    Message, CallbackQuery,
    InlineKeyboardButton, InlineKeyboardMarkup,
)
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from config import (
    SUPPORT_CHAT_IDS, SUPPORT_MINIAPP_URL,
    ADMIN_IDS, ALL_OPERATOR_IDS, SITE_URL, WEBHOOK_SECRET,
)
from services.ai import ask_ai, is_auto_respond

router = Router()
logger = logging.getLogger("SOULDAWN.support")


class ReplyStates(StatesGroup):
    waiting_for_reply_text = State()
    waiting_new_ticket = State()


def _api_base() -> str:
    return SITE_URL.rstrip("/") if SITE_URL else ""


def _api_headers() -> dict:
    """Headers for bot→web API calls (auth via shared secret)."""
    h: dict = {"Content-Type": "application/json"}
    if WEBHOOK_SECRET:
        h["X-Bot-Secret"] = WEBHOOK_SECRET
    return h


# ═══════════════════════════════════════════════════════════════════
# /start — Entry point
# ═══════════════════════════════════════════════════════════════════

@router.message(CommandStart())
async def cmd_start(message: Message):
    user_id = message.from_user.id

    # Admin / operator sees operator panel
    if user_id in ALL_OPERATOR_IDS:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="🖥️ Панель оператора", callback_data="adm:back"),
                InlineKeyboardButton(text="🔍 Диагностика", callback_data="adm:debug"),
            ],
        ])
        role = "👑 Админ" if user_id in ADMIN_IDS else "👥 Оператор"
        await message.answer(
            f"🖥️ <b>SOULDAWN Support — {role}</b>\n\n"
            f"Используйте кнопки ниже или команды:\n"
            f"/admin — панель управления\n"
            f"/debug — диагностика системы",
            parse_mode="HTML", reply_markup=kb,
        )
        return

    # Regular user
    kb = InlineKeyboardMarkup(inline_keyboard=[[]])
    if SUPPORT_MINIAPP_URL:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="📱 Открыть окно поддержки",
                web_app={"url": SUPPORT_MINIAPP_URL},
            )],
        ])
    await message.answer(
        "👋 <b>Добро пожаловать в поддержку SOULDAWN!</b>\n\n"
        "Напишите вопрос — AI ответит мгновенно.\n"
        "Если вопрос сложный — передадим оператору.\n\n"
        "Команды:\n"
        "/tickets — мои обращения\n"
        "/new — новое обращение оператору",
        parse_mode="HTML", reply_markup=kb,
    )


# ═══════════════════════════════════════════════════════════════════
# /tickets — User ticket history
# ═══════════════════════════════════════════════════════════════════

@router.message(Command("tickets"))
async def cmd_tickets(message: Message):
    api = _api_base()
    if not api:
        await message.answer("⚠️ Сервис недоступен (SITE_URL не настроен).")
        return

    tg_id = str(message.from_user.id)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{api}/api/tickets/history?telegramId={tg_id}",
                headers=_api_headers(),
                timeout=aiohttp.ClientTimeout(total=5),
            ) as res:
                data = await res.json()
                tickets = data.get("tickets", [])

        if not tickets:
            await message.answer("📭 У вас нет обращений.")
            return

        lines = ["📋 <b>Ваши обращения:</b>\n"]
        for t in tickets[:5]:
            status_emoji = {
                "open": "🟡", "in_progress": "🔵",
                "answered": "✅", "closed": "⚫",
            }.get(t.get("status", ""), "⚪")
            preview = (t.get("original_text", t.get("message", "")) or "")[:40]
            tid = str(t.get("id", ""))[:8]
            lines.append(f"{status_emoji} <code>{tid}</code> — {preview}")

        await message.answer("\n".join(lines), parse_mode="HTML")
    except Exception as e:
        await message.answer(f"⚠️ Не удалось загрузить обращения: {e}")


# ═══════════════════════════════════════════════════════════════════
# /new — Force create ticket (skip AI)
# ═══════════════════════════════════════════════════════════════════

@router.message(Command("new"))
async def cmd_new(message: Message, state: FSMContext):
    await state.set_state(ReplyStates.waiting_new_ticket)
    await message.answer(
        "✍️ <b>Новое обращение оператору</b>\n\n"
        "Напишите текст следующим сообщением — "
        "он будет передан оператору напрямую, минуя AI.\n\n"
        "/start — отмена",
        parse_mode="HTML",
    )


@router.message(ReplyStates.waiting_new_ticket, F.text)
async def submit_new_ticket(message: Message, state: FSMContext, bot: Bot):
    await state.clear()
    text = message.text.strip()
    if not text:
        return
    # Skip AI — go directly to operator
    await _create_or_append_ticket(message, bot, text)


# ═══════════════════════════════════════════════════════════════════
# Text messages — AI-first flow
# ═══════════════════════════════════════════════════════════════════

@router.message(F.text & ~F.text.startswith("/"))
async def handle_user_message(message: Message, bot: Bot, state: FSMContext):
    """Main message handler. AI tries first, then falls back to operator."""
    # If user is in waiting_new_ticket state, let that handler catch it
    if await state.get_state() == ReplyStates.waiting_new_ticket:
        return
    user_id = message.from_user.id

    # Operators don't trigger support flow
    if user_id in ALL_OPERATOR_IDS:
        return

    text = message.text.strip()
    if not text:
        return

    # ── Step 1: Try AI ─────────────────────────────────────────
    if is_auto_respond():
        ai_response = await ask_ai(text)

        if ai_response and ai_response != "HANDOFF":
            # AI answered — show with option to escalate
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [
                    InlineKeyboardButton(text="✅ Помогло!", callback_data="ai:thanks"),
                    InlineKeyboardButton(text="💬 К оператору", callback_data="ai:to_operator"),
                ],
            ])
            await message.answer(
                f"🤖 <b>AI SOULDAWN:</b>\n\n{ai_response}",
                parse_mode="HTML", reply_markup=kb,
            )
            return

        # AI returned HANDOFF or error — proceed to operator

    # ── Step 2: Create/append ticket ───────────────────────────
    await _create_or_append_ticket(message, bot, text)


async def _create_or_append_ticket(message: Message, bot: Bot, text: str):
    """Create a new ticket or append to an existing open one."""
    api = _api_base()
    tg_id = str(message.from_user.id)

    # No API — fallback: forward directly to operators
    if not api:
        await _forward_to_operators(bot, tg_id, message.from_user.full_name, text)
        await message.answer("✅ Обращение отправлено операторам.")
        return

    try:
        async with aiohttp.ClientSession() as session:
            # Check for existing open ticket
            async with session.get(
                f"{api}/api/tickets/history?telegramId={tg_id}",
                headers=_api_headers(),
                timeout=aiohttp.ClientTimeout(total=5),
            ) as res:
                history_data = await res.json()
                tickets = history_data.get("tickets", [])
                open_ticket = next(
                    (t for t in tickets if t.get("status") == "open"), None
                )

            if open_ticket:
                # Append to existing ticket
                await session.post(
                    f"{api}/api/tickets/messages",
                    json={"ticketId": open_ticket["id"], "sender": "user", "text": text},
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                )
                ticket_id = open_ticket["id"]
            else:
                # Create new ticket
                async with session.post(
                    f"{api}/api/tickets/create",
                    json={"telegramId": tg_id, "category": "general", "message": text},
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as create_res:
                    create_data = await create_res.json()
                    ticket_id = create_data.get("ticketId", "unknown")
    except Exception as e:
        logger.error(f"Failed to create/send ticket: {e}")
        # Fallback: forward to operators
        await _forward_to_operators(bot, tg_id, message.from_user.full_name, text)
        await message.answer("✅ Обращение отправлено операторам.")
        return

    # Web API already notifies operators via /api/tickets/create (TG + in-app notification).
    # No need to send duplicate notifications here.
    await message.answer(
        "✅ Обращение зарегистрировано. Ожидайте ответа оператора."
    )


async def _forward_to_operators(bot: Bot, tg_id: str, name: str, text: str):
    """Fallback: directly forward message to operators."""
    for op_id in SUPPORT_CHAT_IDS:
        try:
            await bot.send_message(
                chat_id=op_id,
                text=f"❓ <b>Обращение</b> от <code>{tg_id}</code> ({name})\n\n{text}",
                parse_mode="HTML",
            )
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════
# AI feedback callbacks
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data == "ai:thanks")
async def ai_thanks(callback: CallbackQuery):
    await callback.answer("Рады помочь! 😊")
    try:
        await callback.message.edit_reply_markup(reply_markup=None)
    except Exception:
        pass


@router.callback_query(F.data == "ai:to_operator")
async def ai_to_operator(callback: CallbackQuery, bot: Bot):
    """User clicked 'to operator' after AI response — create ticket."""
    await callback.answer()
    user_id = callback.from_user.id
    tg_id = str(user_id)

    try:
        await callback.message.edit_reply_markup(reply_markup=None)
    except Exception:
        pass

    await callback.message.answer("🔄 Передаём оператору...")

    # Build context text for the ticket
    ticket_text = "Пользователь запросил оператора после ответа AI."

    if callback.message and callback.message.text:
        ticket_text = callback.message.text

    # Create ticket via API — the web endpoint handles operator notification.
    api = _api_base()

    if api:
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{api}/api/tickets/create",
                    json={"telegramId": tg_id, "category": "general", "message": f"[Эскалация AI] {ticket_text[:500]}"},
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                )
        except Exception as e:
            logger.error(f"Failed to create escalation ticket: {e}")
            # Fallback: notify operators directly if API fails
            for op_id in ALL_OPERATOR_IDS:
                try:
                    await bot.send_message(
                        chat_id=op_id,
                        text=(
                            f"🔀 <b>Эскалация от AI</b>\n\n"
                            f"<b>От:</b> <code>{tg_id}</code> ({callback.from_user.full_name})\n\n"
                            f"<b>Контекст AI-ответа:</b>\n<i>{ticket_text[:300]}</i>"
                        ),
                        parse_mode="HTML",
                    )
                except Exception:
                    pass
    else:
        # No API — notify operators directly
        for op_id in ALL_OPERATOR_IDS:
            try:
                await bot.send_message(
                    chat_id=op_id,
                    text=(
                        f"🔀 <b>Эскалация от AI</b>\n\n"
                        f"<b>От:</b> <code>{tg_id}</code> ({callback.from_user.full_name})\n\n"
                        f"<b>Контекст:</b>\n<i>{ticket_text[:300]}</i>"
                    ),
                    parse_mode="HTML",
                )
            except Exception:
                pass


# ═══════════════════════════════════════════════════════════════════
# Operator reply (FSM)
# ═══════════════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("ticket:reply:"))
async def on_ticket_reply(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ALL_OPERATOR_IDS:
        await callback.answer("Нет доступа", show_alert=True)
        return

    ticket_id = callback.data.split(":")[-1]
    await state.update_data(ticket_id=ticket_id)
    await state.set_state(ReplyStates.waiting_for_reply_text)
    await callback.message.answer(
        f"✍️ <b>Введите ответ для тикета</b> <code>{ticket_id[:12]}</code>:",
        parse_mode="HTML",
    )
    await callback.answer()


@router.message(ReplyStates.waiting_for_reply_text)
async def send_operator_reply(message: Message, state: FSMContext):
    api = _api_base()
    state_data = await state.get_data()
    ticket_id = state_data["ticket_id"]
    text = message.text
    await state.clear()

    if api:
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{api}/api/tickets/messages",
                    json={"ticketId": ticket_id, "sender": "operator", "text": text},
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                )
                await session.post(
                    f"{api}/api/admin/tickets/{ticket_id}/reply",
                    json={"text": text},
                    headers=_api_headers(),
                    timeout=aiohttp.ClientTimeout(total=5),
                )
        except Exception as e:
            logger.error(f"Failed to send reply via API: {e}")

    await message.answer("✅ <b>Ответ отправлен клиенту.</b>", parse_mode="HTML")