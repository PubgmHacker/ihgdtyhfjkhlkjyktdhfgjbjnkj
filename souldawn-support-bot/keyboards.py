"""SOULDAWN — All keyboard builders."""
from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import MINIAPP_URL, SITE_URL, SUPPORT_MINIAPP_URL
from utils import _fmt_price


def main_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 Каталог", web_app=WebAppInfo(url=MINIAPP_URL))],
        [
            InlineKeyboardButton(text="🌐 Сайт", url=SITE_URL),
            InlineKeyboardButton(text="ℹ️ Инфо", callback_data="menu:info"),
        ],
        [
            InlineKeyboardButton(text="💬 Поддержка", callback_data="menu:support"),
            InlineKeyboardButton(text="🔗 Ссылки", callback_data="menu:links"),
        ],
    ])


def info_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📦  Доставка", callback_data="faq:delivery"),
            InlineKeyboardButton(text="🔄  Возврат", callback_data="faq:returns"),
        ],
        [
            InlineKeyboardButton(text="📏  Размеры", callback_data="faq:sizes"),
            InlineKeyboardButton(text="💳  Оплата", callback_data="faq:payment"),
        ],
        [
            InlineKeyboardButton(text="✅  Качество", callback_data="faq:quality"),
            InlineKeyboardButton(text="📞  Контакты", callback_data="faq:contact"),
        ],
        [InlineKeyboardButton(text="←  Назад", callback_data="back_to_menu")],
    ])


def support_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🤖  AI-ассистент", callback_data="ai:ask"),
            InlineKeyboardButton(text="💬  Оператор", callback_data="operator"),
        ],
        [
            InlineKeyboardButton(text="📦  Мой заказ", callback_data="order"),
            InlineKeyboardButton(text="📞  Контакты", callback_data="faq:contact"),
        ],
        [InlineKeyboardButton(text="←  Назад", callback_data="back_to_menu")],
    ])


def back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="←  Назад", callback_data="back_to_menu")]
    ])


def operator_confirm_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅  Отправить", callback_data="confirm_operator")],
        [InlineKeyboardButton(text="❌  Отмена", callback_data="back_to_menu")],
    ])


def ai_helpful_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅  Спасибо!", callback_data="ai:thanks")],
        [InlineKeyboardButton(text="💬  Оператор", callback_data="ai:to_operator")],
    ])


def pay_kb(confirmation_url: str, total_kopecks: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"💳  Оплатить {_fmt_price(total_kopecks)}", url=confirmation_url)],
        [InlineKeyboardButton(text="🔄  Проверить оплату", callback_data="check_payment")],
        [InlineKeyboardButton(text="❌  Отмена", callback_data="back_to_menu")],
    ])