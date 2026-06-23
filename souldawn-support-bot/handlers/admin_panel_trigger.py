from aiogram import Router
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import Command
from config import ADMIN_IDS

router = Router()

@router.message(Command("admin"))
async def open_admin_panel_support(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return
    admin_url = "https://railway.app"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚙️ Открыть панель управления", web_app=WebAppInfo(url=admin_url))]
    ])
    await message.answer("🖥️ <b>SOULDAWN SUPPORT — Панель оператора тикетов:</b>", parse_mode="HTML", reply_markup=kb)
