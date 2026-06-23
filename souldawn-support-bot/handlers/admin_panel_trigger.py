from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import aiohttp
from config import ADMIN_IDS

router = Router()

class ReplyStates(StatesGroup):
    waiting_for_reply_text = State()

@router.message(Command("admin"))
async def open_admin_panel_support(message: Message):
    if message.from_user.id not in ADMIN_IDS: return
    admin_url = "https://railway.app"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚙️ Открыть панель управления", web_app=WebAppInfo(url=admin_url))]
    ])
    await message.answer("🖥️ <b>SOULDAWN SUPPORT — Панель оператора тикетов:</b>", parse_mode="HTML", reply_markup=kb)

# Перехват клика по кнопке "Ответить"
@router.callback_query(F.data.startswith("ticket:reply:"))
async def handle_operator_reply_click(callback: CallbackQuery, state: FSMContext):
    ticket_id = callback.data.split(":")[-1]
    await state.update_data(ticket_id=ticket_id)
    await state.set_state(ReplyStates.waiting_for_reply_text)
    await callback.message.answer(f"✍️ <b>Введите текст ответа для тикета</b> <code>{ticket_id}</code>:\n(Сообщение сразу отобразится у пользователя)", parse_mode="HTML")
    await callback.answer()

# Отправка текста ответа во все системы
@router.message(ReplyStates.waiting_for_reply_text)
async def process_operator_reply_text(message: Message, state: FSMContext):
    state_data = await state.get_data()
    ticket_id = state_data["ticket_id"]
    text = message.text
    await state.clear()

    # Отправляем ответ оператора в единую базу сообщений Next.js
    async with aiohttp.ClientSession() as session:
        payload = {"ticketId": ticket_id, "sender": "operator", "text": text}
        async with session.post("https://railway.app", json=payload) as res:
            pass

    await message.answer("✅ <b>Ответ успешно отправлен и синхронизирован везде!</b>", parse_mode="HTML")
