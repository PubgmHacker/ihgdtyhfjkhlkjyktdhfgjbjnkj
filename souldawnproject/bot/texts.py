"""SOULDAWN — All text functions (no bot imports)."""
from __future__ import annotations

import time

from utils import _fmt_price


def welcome() -> str:
    h = time.localtime().tm_hour
    if 5 <= h < 12:
        g = "Доброе утро"
    elif 12 <= h < 17:
        g = "Добрый день"
    elif 17 <= h < 21:
        g = "Добрый вечер"
    else:
        g = "Доброй ночи"
    return (
        f"SOULDAWN\n\n"
        f"{g}! Я официальный бот проекта SOULDAWN — "
        f"уличный бренд одежды.\n\n"
        f"Здесь ты можешь посмотреть каталог, "
        f"оформить заказ и получить консультацию.\n\n"
        f"Выбери раздел ниже."
    )


def catalog_menu() -> str:
    return (
        "SOULDAWN · Каталог\n\n"
        "Выбери категорию или открой весь каталог."
    )


def info_menu() -> str:
    return (
        "SOULDAWN · Информация\n\n"
        "Доставка, возврат, размеры, оплата и качество."
    )


def support_menu() -> str:
    return (
        "SOULDAWN · Поддержка\n\n"
        "Задай вопрос AI или напиши оператору."
    )


def links_menu() -> str:
    return (
        "SOULDAWN · Ссылки\n\n"
        "souldawn.com — сайт\n"
        "@souldawn — Instagram\n"
        "@souldawn_support — Telegram\n\n"
        "Поддержка работает ежедневно 10:00–19:00."
    )


def profile_menu(user_data: dict | None = None) -> str:
    if user_data:
        name = user_data.get("name", "Пользователь")
        orders = user_data.get("order_count", 0)
        total = user_data.get("total_spent", 0)
        return (
            f"Привет, {name}\n\n"
            f"Заказов: {orders}\n"
            f"На сумму: {_fmt_price(total * 100) if total else '0 ₽'}\n\n"
            f"Полный профиль доступен на сайте."
        )
    return "Оформи первый заказ через мини-приложение или сайт."


def reviews_text() -> str:
    return "Читай реальные отзывы покупателей в нашем канале."


def faq_delivery() -> str:
    return (
        "SOULDAWN · Доставка\n\n"
        "СДЭК — от 350₽, 2–5 дней\n"
        "Почта — от 250₽, 5–10 дней\n"
        "Яндекс — от 300₽, 1–3 дня\n"
        "EMS — от 1500₽, 7–14 дней\n\n"
        "Бесплатно при заказе от 5 000₽."
    )


def faq_returns() -> str:
    return (
        "SOULDAWN · Возврат\n\n"
        "14 дней на возврат.\n"
        "Товар без признаков использования, с бирками.\n\n"
        "1. Напиши номер заказа\n"
        "2. Согласуем возврат\n"
        "3. Отправь товар\n"
        "4. Деньги возвращаются за 3–5 дней"
    )


def faq_sizes() -> str:
    return (
        "SOULDAWN · Таблица размеров\n\n"
        "S — грудь 106, длина 70\n"
        "M — грудь 112, длина 72\n"
        "L — грудь 118, длина 74\n"
        "XL — грудь 124, длина 76\n\n"
        "Крой оверсайз."
    )


def faq_payment() -> str:
    return (
        "SOULDAWN · Оплата\n\n"
        "Visa / MasterCard / МИР\n"
        "СБП\n"
        "YooKassa\n\n"
        "Все платежи защищены."
    )


def faq_quality() -> str:
    return (
        "SOULDAWN · Качество\n\n"
        "100% хлопок, плотность 220–400 г/м².\n"
        "Фурнитура YKK, двойные строчки.\n"
        "Стирка при 30°C."
    )


def faq_contact() -> str:
    return (
        "SOULDAWN · Контакты\n\n"
        "@souldawn_support — Telegram\n"
        "support@souldawn.com — почта\n"
        "souldawn.com — сайт\n\n"
        "Пн–Пт 10:00–19:00"
    )


def operator_ask() -> str:
    return (
        "SOULDAWN · Поддержка\n\n"
        "Напиши свой вопрос — мы перешлём оператору.\n"
        "Ответ в течение 1 часа.\n\n"
        "/start — отмена"
    )


def confirm_send(text: str) -> str:
    p = text[:200] + ("..." if len(text) > 200 else "")
    return (
        f"SOULDAWN · Твоё сообщение:\n\n"
        f"«{p}»\n\n"
        f"Отправить оператору?"
    )


def sent_ok() -> str:
    return "Отправлено. Оператор ответит в ближайшее время."


def sent_fail() -> str:
    return "Не удалось отправить. Попробуй позже."


def offline() -> str:
    return "Оператор не на связи. Попробуй позже."


def order_cmd() -> str:
    return "Напиши @souldawn_support для связи по заказу."


def ai_ask_text() -> str:
    return (
        "SOULDAWN · AI-ассистент\n\n"
        "Напиши вопрос — AI ответит мгновенно.\n"
        "Помогает с товарами, размерами, доставкой.\n\n"
        "/start — отмена"
    )


def ai_answer(q: str, a: str) -> str:
    return f"Вопрос: {q}\n\nОтвет: {a}\n\nПомог?"


def ai_handoff(q: str) -> str:
    return (
        f"SOULDAWN · Нужен оператор\n\n"
        f"«{q[:200]}»\n\n"
        f"Передаём оператору..."
    )


def pay_pending_text(total_kopecks: int, items_count: int) -> str:
    total = _fmt_price(total_kopecks)
    return (
        f"SOULDAWN · Оплата заказа\n\n"
        f"Товаров: {items_count} шт.\n"
        f"Итого: {total}\n\n"
        f"Нажми кнопку ниже для оплаты.\n"
        f"Ссылка активна 30 минут."
    )


def pay_confirmed_text(total_kopecks: int) -> str:
    return (
        f"SOULDAWN · Оплата подтверждена\n\n"
        f"Сумма: {_fmt_price(total_kopecks)}\n\n"
        f"Заказ передан оператору. Он свяжется с тобой в ближайшее время.\n\n"
        f"/start — вернуться в меню"
    )
