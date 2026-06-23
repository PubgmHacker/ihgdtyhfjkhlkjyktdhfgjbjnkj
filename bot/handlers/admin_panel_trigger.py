from aiogram import Router
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import Command
from config import ADMIN_IDS, MINIAPP_URL

router = Router()

@router.message(Command("admin"))
async def open_admin_panel(message: Message):
    if message.from_user.id not in ADMIN_IDS:
        return
    base_url = MINIAPP_URL if MINIAPP_URL.endswith("/") else MINIAPP_URL + "/"
    admin_url = base_url + "admin"
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚙️ Открыть панель управления", web_app=WebAppInfo(url=admin_url))]
    ])
    await message.answer("🖥️ <b>SOULDAWN — Вход в панель администратора:</b>", parse_mode="HTML", reply_markup=kb)
