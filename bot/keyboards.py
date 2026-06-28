"""SOULDAWN — All keyboard builders."""
from __future__ import annotations

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import SITE_URL, SUPPORT_BOT_URL
from utils import _fmt_price


def _webapp_url(path: str = "") -> str:
    """Build a WebApp URL pointing to the Next.js site on Railway.

    The site auto-detects Telegram.WebApp.initData and authenticates the user.
    No need for ?site= param anymore — the site IS the API.
    """
    if not SITE_URL:
        return ""
    base = SITE_URL.rstrip("/")
    return f"{base}{path}" if path else base


def main_kb() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []

    # Кнопка каталога (WebApp) — главный CTA, отдельной широкой строкой.
    url = _webapp_url()
    if url:
        rows.append([InlineKeyboardButton(text="🛍️  КАТАЛОГ", web_app=WebAppInfo(url=url))])

    # FAQ (WebApp на Next.js сайте) + Поддержка (инлайн ссылка на саппорт-бот)
    bottom_row = []
    faq_url = _webapp_url("/faq")
    if faq_url:
        bottom_row.append(InlineKeyboardButton(text="❓  FAQ", web_app=WebAppInfo(url=faq_url)))
    if SUPPORT_BOT_URL:
        bottom_row.append(InlineKeyboardButton(text="💬  Поддержка", url=SUPPORT_BOT_URL))
    if bottom_row:
        rows.append(bottom_row)

    return InlineKeyboardMarkup(inline_keyboard=rows)


def admin_panel_kb() -> InlineKeyboardMarkup:
    """Инлайн админ-панель (вызывается по /admin)."""
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(text="📊  Статистика", callback_data="admin:stats"),
            InlineKeyboardButton(text="🟢  Онлайн", callback_data="admin:online"),
        ],
        [
            InlineKeyboardButton(text="📦  Заказы", callback_data="admin:orders"),
            InlineKeyboardButton(text="🎫  Тикеты", callback_data="admin:tickets"),
        ],
        [
            InlineKeyboardButton(text="📣  Рассылка", callback_data="admin:broadcast"),
            InlineKeyboardButton(text="💰  Расходы", callback_data="admin:expenses"),
        ],
    ]
    url = _webapp_url("/admin")
    if url:
        rows.append([
            InlineKeyboardButton(
                text="🖥  Открыть полную панель",
                web_app=WebAppInfo(url=url),
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def admin_back_kb() -> InlineKeyboardMarkup:
    """Кнопка «Назад» в корень админ-панели."""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="←  К панели", callback_data="admin:home")]
    ])


def shop_or_menu_kb() -> InlineKeyboardMarkup:
    """Клавиатура после оплаты/заказа."""
    rows: list[list[InlineKeyboardButton]] = []
    url = _webapp_url()
    if url:
        rows.append([InlineKeyboardButton(text="КАТАЛОГ", web_app=WebAppInfo(url=url))])
    rows.append([InlineKeyboardButton(text="MENU", callback_data="back_to_menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def support_kb() -> InlineKeyboardMarkup:
    """Поддержка — перенаправление на саппорт-бот."""
    rows: list[list[InlineKeyboardButton]] = []
    if SUPPORT_BOT_URL:
        rows.append([InlineKeyboardButton(text="💬  Написать в поддержку", url=SUPPORT_BOT_URL)])
    rows.append([InlineKeyboardButton(text="←  Назад", callback_data="back_to_menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


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
        [InlineKeyboardButton(text="💬  Оператор", callback_data="operator")],
    ])


def pay_kb(confirmation_url: str, total_kopecks: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"💳  Оплатить {_fmt_price(total_kopecks)}", url=confirmation_url)],
        [InlineKeyboardButton(text="🔄  Проверить оплату", callback_data="check_payment")],
        [InlineKeyboardButton(text="❌  Отмена", callback_data="back_to_menu")],
    ])


def _stats_back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад", callback_data="stats:main")]
    ])


def _stats_main_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Обзор", callback_data="stats:overview"),
         InlineKeyboardButton(text="💰 Финансы", callback_data="stats:finance")],
        [InlineKeyboardButton(text="📦 Заказы", callback_data="stats:orders"),
         InlineKeyboardButton(text="👥 Пользователи", callback_data="stats:users")],
        [InlineKeyboardButton(text="🟢 Онлайн", callback_data="stats:online"),
         InlineKeyboardButton(text="📋 Расходы", callback_data="stats:expenses")],
    ])
