"""SOULDAWN — All keyboard builders.

Premium emoji — используем custom_emoji_id через InlineKeyboardButton.
Для обычных ботов (non-premium) Telegram показывает fallback-эмоджи автоматически.
Для premium-ботов (подписка Telegram Premium) отображаются анимированные premium-эмоджи.
"""
from __future__ import annotations

import os

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import MINIAPP_URL, SITE_URL
from utils import _fmt_price

# ---------------------------------------------------------------------------
# Premium emoji IDs (палитра «Рассвет после боя»)
# Формат: «fallback_emoji» + custom_emoji_id через HTML-тег <tg-emoji>
# В InlineKeyboardButton.text премиум-эмоджи передаются как обычный Unicode-символ
# (без HTML-разметки), поэтому используем визуально близкие Unicode-символы.
# ---------------------------------------------------------------------------

# Главное меню
_SHOP    = "\U0001F6CD\uFE0F"   # шоппинг-бэг
_FAQ     = "\U0001F4CB"         # буфер (список)
_SUPPORT = "\U0001F4AC"         # чат-пузырь
_PROFILE = "\U0001F464"         # силуэт человека

# FAQ-статьи
_DELIVERY = "\U0001F4E6"        # посылка
_RETURNS  = "\U0001F504"        # циклические стрелки
_SIZES    = "\U0001F4CF"        # линейка
_PAYMENT  = "\U0001F4B3"        # карта
_QUALITY  = "\U0001F48E"        # драгоценный камень
_CONTACT  = "\U0001F4DE"        # телефон
_BRAND    = "\U0001F319"        # полумесяц (бренд)
_SITE     = "\U0001F310"        # глобус

# Админ
_STATS    = "\U0001F4CA"        # график
_ONLINE   = "\U0001F7E2"        # зелёный круг
_ORDERS   = "\U0001F4E6"        # посылка
_TICKETS  = "\U0001F3AB"        # билет
_CAST     = "\U0001F4E3"        # мегафон
_EXPENSE  = "\U0001F4B0"        # мешок денег
_PANEL    = "\U0001F5A5\uFE0F"  # монитор

# Навигация
_BACK     = "\u2190"            # стрелка назад
_PREV     = "\u25C0"            # левая стрелка
_NEXT     = "\u25B6"            # правая стрелка
_PAY      = "\U0001F4B3"        # карта
_CHECK    = "\U0001F504"        # проверка
_CANCEL   = "\u2715"            # крест
_OK       = "\u2714"            # галочка
_AI       = "\U0001F916"        # робот
_OPERATOR = "\U0001F4AC"        # чат
_DAWN     = "\U0001F305"        # рассвет (бренд)

# ---------------------------------------------------------------------------
# FAQ статьи — порядок для пагинации
# ---------------------------------------------------------------------------
FAQ_ITEMS: list[tuple[str, str, str]] = [
    (_DELIVERY, "Доставка",   "faq:delivery"),
    (_RETURNS,  "Возврат",     "faq:returns"),
    (_SIZES,    "Размеры",     "faq:sizes"),
    (_PAYMENT,  "Оплата",      "faq:payment"),
    (_QUALITY,  "Качество",    "faq:quality"),
    (_BRAND,    "О бренде",   "faq:brand"),
    (_CONTACT,  "Контакты",   "faq:contact"),
    (_SITE,     "Наш сайт",   "faq:site"),
]


# REVIEW_CHANNEL_URL — ссылка на публичную группу отзывов
REVIEW_CHANNEL_URL = os.environ.get("REVIEW_CHANNEL_URL", "")


def main_kb() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []

    # Главный CTA — магазин (WebApp)
    if MINIAPP_URL:
        rows.append([
            InlineKeyboardButton(
                text=f"{_SHOP}  МАГАЗИН",
                web_app=WebAppInfo(url=MINIAPP_URL),
            )
        ])

    # FAQ + Поддержка
    rows.append([
        InlineKeyboardButton(text=f"{_FAQ}  FAQ", callback_data="menu:faq"),
        InlineKeyboardButton(text=f"{_SUPPORT}  Поддержка", callback_data="menu:support"),
    ])

    # Отзывы — ссылка на публичную группу
    if REVIEW_CHANNEL_URL:
        rows.append([
            InlineKeyboardButton(
                text=f"{_DAWN}  Отзывы покупателей",
                url=REVIEW_CHANNEL_URL,
            )
        ])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def faq_menu_kb() -> InlineKeyboardMarkup:
    """Главное меню FAQ — все статьи списком."""
    rows: list[list[InlineKeyboardButton]] = []
    # Статьи по 2 в ряд
    for i in range(0, len(FAQ_ITEMS), 2):
        row = []
        for icon, label, cb in FAQ_ITEMS[i:i+2]:
            row.append(InlineKeyboardButton(text=f"{icon}  {label}", callback_data=cb))
        rows.append(row)
    rows.append([InlineKeyboardButton(text=f"{_BACK}  Назад", callback_data="back_to_menu")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def faq_article_kb(current_key: str) -> InlineKeyboardMarkup:
    """Клавиатура внутри статьи: ← предыдущая | список | следующая →"""
    keys = [item[2].split(":", 1)[1] for item in FAQ_ITEMS]
    try:
        idx = keys.index(current_key)
    except ValueError:
        idx = 0

    nav_row: list[InlineKeyboardButton] = []
    if idx > 0:
        prev_key = keys[idx - 1]
        nav_row.append(InlineKeyboardButton(
            text=f"{_PREV}  {FAQ_ITEMS[idx-1][1]}",
            callback_data=f"faq:{prev_key}",
        ))
    nav_row.append(InlineKeyboardButton(
        text=f"{_FAQ}  Список",
        callback_data="menu:faq",
    ))
    if idx < len(keys) - 1:
        next_key = keys[idx + 1]
        nav_row.append(InlineKeyboardButton(
            text=f"{FAQ_ITEMS[idx+1][1]}  {_NEXT}",
            callback_data=f"faq:{next_key}",
        ))

    return InlineKeyboardMarkup(inline_keyboard=[
        nav_row,
        [InlineKeyboardButton(text=f"{_BACK}  Меню", callback_data="back_to_menu")],
    ])


def admin_panel_kb() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = [
        [
            InlineKeyboardButton(text=f"{_STATS}  Статистика", callback_data="admin:stats"),
            InlineKeyboardButton(text=f"{_ONLINE}  Онлайн", callback_data="admin:online"),
        ],
        [
            InlineKeyboardButton(text=f"{_ORDERS}  Заказы", callback_data="admin:orders"),
            InlineKeyboardButton(text=f"{_TICKETS}  Тикеты", callback_data="admin:tickets"),
        ],
        [
            InlineKeyboardButton(text=f"{_CAST}  Рассылка", callback_data="admin:broadcast"),
            InlineKeyboardButton(text=f"{_EXPENSE}  Расходы", callback_data="admin:expenses"),
        ],
    ]
    if MINIAPP_URL:
        rows.append([
            InlineKeyboardButton(
                text=f"{_PANEL}  Полная панель",
                web_app=WebAppInfo(url=f"{MINIAPP_URL}?view=admin"),
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def admin_back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"{_BACK}  К панели", callback_data="admin:home")]
    ])


def shop_or_menu_kb() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    if MINIAPP_URL:
        rows.append([
            InlineKeyboardButton(
                text=f"{_SHOP}  МАГАЗИН",
                web_app=WebAppInfo(url=MINIAPP_URL),
            )
        ])
    rows.append([
        InlineKeyboardButton(text=f"{_BACK}  Меню", callback_data="back_to_menu")
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def support_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=f"{_AI}  AI-ассистент", callback_data="ai:ask"),
            InlineKeyboardButton(text=f"{_OPERATOR}  Оператор", callback_data="operator"),
        ],
        [
            InlineKeyboardButton(text=f"{_ORDERS}  Мой заказ", callback_data="order"),
            InlineKeyboardButton(text=f"{_FAQ}  FAQ", callback_data="menu:faq"),
        ],
        [InlineKeyboardButton(text=f"{_BACK}  Назад", callback_data="back_to_menu")],
    ])


def back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"{_BACK}  Назад", callback_data="back_to_menu")]
    ])


def operator_confirm_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"{_OK}  Отправить", callback_data="confirm_operator")],
        [InlineKeyboardButton(text=f"{_CANCEL}  Отмена", callback_data="back_to_menu")],
    ])


def ai_helpful_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"{_OK}  Спасибо!", callback_data="ai:thanks")],
        [InlineKeyboardButton(text=f"{_OPERATOR}  Оператор", callback_data="operator")],
    ])


def pay_kb(confirmation_url: str, total_kopecks: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text=f"{_PAY}  Оплатить {_fmt_price(total_kopecks)}",
            url=confirmation_url,
        )],
        [InlineKeyboardButton(text=f"{_CHECK}  Проверить оплату", callback_data="check_payment")],
        [InlineKeyboardButton(text=f"{_CANCEL}  Отмена", callback_data="back_to_menu")],
    ])


def _stats_back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=f"{_BACK}  Назад", callback_data="stats:main")]
    ])


def _stats_main_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=f"{_STATS}  Обзор", callback_data="stats:overview"),
            InlineKeyboardButton(text=f"{_EXPENSE}  Финансы", callback_data="stats:finance"),
        ],
        [
            InlineKeyboardButton(text=f"{_ORDERS}  Заказы", callback_data="stats:orders"),
            InlineKeyboardButton(text=f"{_PROFILE}  Пользователи", callback_data="stats:users"),
        ],
        [
            InlineKeyboardButton(text=f"{_ONLINE}  Онлайн", callback_data="stats:online"),
            InlineKeyboardButton(text=f"{_EXPENSE}  Расходы", callback_data="stats:expenses"),
        ],
    ])
