"""SOULDAWN Support Bot — AI Assistant with Multi-Model Fallback."""
from __future__ import annotations
import asyncio
import logging
from aiogram import Router, F, Bot
from aiogram.types import Message
from openai import AsyncOpenAI

from config import OPENAI_API_KEY, OPENAI_BASE_URL, SUPPORT_CHAT_IDS

router = Router()
logger = logging.getLogger("SOULDAWN.support")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

SYSTEM_PROMPT = """Ты — ИИ-ассистент поддержки бренда уличной одежды SOULDAWN.
Помогай клиентам отвечать на вопросы о заказах, качестве вещей, доставке.
Отвечай вежливо, лаконично и стильно.
⚠️ ВАЖНО: Если пользователь просит позвать человека, требует оператора, хочет оформить возврат или ты не знаешь ответ — напиши строго одну фразу: '[OPERATOR]' и абсолютно ничего больше."""

# Список надежных бесплатных моделей на OpenRouter для подстраховки
MODELS_TO_TRY = [
    "meta-llama/llama-3-8b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "qwen/qwen-2-7b-instruct:free"
]

@router.message(F.text)
async def handle_support_message(message: Message, bot: Bot):
    if not OPENAI_API_KEY:
        await forward_to_operators(message, bot)
        return

    ai_answer = None
    
    # Пытаемся получить ответ от моделей по очереди
    for model_name in MODELS_TO_TRY:
        try:
            response = await openai_client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message.text}
                ],
                timeout=7.0
            )
            ai_answer = response.choices.message.content.strip()
            if ai_answer:
                break # Если получили ответ, выходим из цикла подбора моделей
        except Exception as e:
            logger.warning(f"Model {model_name} failed: {e}. Trying next...")
            continue

    # Если ни одна модель не ответила
    if not ai_answer:
        await message.answer("🔄 Связываю вас с оператором службы поддержки...")
        await forward_to_operators(message, bot, ai_answer=None)
        return

    # Если успешный ответ содержит триггер перевода на человека
    if "[OPERATOR]" in ai_answer:
        await message.answer("🔄 Перенаправляю ваш запрос живому оператору. Пожалуйста, ожидайте...")
        await forward_to_operators(message, bot, ai_answer=ai_answer)
    else:
        await message.answer(ai_answer)

async def forward_to_operators(message: Message, bot: Bot, ai_answer: str | None = None):
    if not SUPPORT_CHAT_IDS:
        return
        
    ai_status = f"\n\n🤖 <b>Ответ ИИ пользователю:</b>\n<i>{ai_answer}</i>" if ai_answer else "\n\n🤖 <b>Ответ ИИ:</b> Не успел ответить / ошибка"
    
    text = (
        f"❓ <b>Новое обращение в саппорт-бот!</b>\n\n"
        f"Пользователь: @{message.from_user.username or '—'}\n"
        f"Telegram ID: <code>{message.from_user.id}</code>\n\n"
        f"Текст обращения:\n<i>{message.text}</i>"
        f"{ai_status}"
    )
    for op_id in SUPPORT_CHAT_IDS:
        try:
            await bot.send_message(chat_id=op_id, text=text, parse_mode="HTML")
            await asyncio.sleep(0.05)
        except Exception as e:
            logger.warning(f"Failed to notify operator {op_id}: {e}")
