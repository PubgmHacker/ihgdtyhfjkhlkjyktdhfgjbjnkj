"""SOULDAWN — Main menu handler (start, catalog, sizes)."""
from __future__ import annotations

from aiogram import Router, F, Bot
from aiogram.types import (
    Message, CallbackQuery, InlineKeyboardButton,
    InlineKeyboardMarkup, WebAppInfo,
)
from aiogram.fsm.context import FSMContext
from aiogram.filters import Command

from config import SITE_URL
from keyboards import main_kb, back_kb
from texts import BANNERS, welcome

router = Router()


def _webapp_url(path: str = "") -> str:
    if not SITE_URL:
        return ""
    base = SITE_URL.rstrip("/")
    return f"{base}{path}" if path else base


@router.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    await message.answer_photo(photo=BANNERS["welcome"], caption=welcome(), reply_markup=main_kb())


@router.message(Command("catalog"))
async def cmd_catalog(message: Message, state: FSMContext):
    await state.clear()
    url = _webapp_url()
    kb = InlineKeyboardMarkup(inline_keyboard=[
        ([InlineKeyboardButton(text="🛒  Открыть каталог", web_app=WebAppInfo(url=url))] if url else []),
        [InlineKeyboardButton(text="←  Меню", callback_data="back_to_menu")],
    ])
    await message.answer_photo(photo=BANNERS["catalog"], caption="SOULDAWN · Каталог\n\nВыбери категорию или открой весь каталог.", reply_markup=kb)


@router.message(Command("sizes"))
async def cmd_sizes(message: Message, state: FSMContext):
    await state.clear()
    faq_url = _webapp_url("/faq")
    if faq_url:
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📏  Таблица размеров", web_app=WebAppInfo(url=faq_url))],
            [InlineKeyboardButton(text="←  Меню", callback_data="back_to_menu")],
        ])
    else:
        kb = back_kb()
    await message.answer("Размеры доступны в FAQ на сайте.", reply_markup=kb)


@router.message(Command("order"))
async def cmd_order(message: Message):
    await message.answer("Для просмотра заказов открой каталог — там есть раздел с твоими заказами.", reply_markup=back_kb())
