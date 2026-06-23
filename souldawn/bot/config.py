"""SOULDAWN — Configuration (all env vars + catalog)."""
from __future__ import annotations

import hashlib
import os

# ======================== ENV VARS ========================
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
SUPPORT_CHAT_ID = int(os.getenv("SUPPORT_CHAT_ID", "520904288"))

# ======================== TELEGRAM LOGIN WIDGET ========================
# Токен того же бота, что и BOT_TOKEN (Login Widget и Mini App используют одного бота).
# По умолчанию берём BOT_TOKEN, чтобы не дублировать секреты.
TG_LOGIN_BOT_TOKEN = os.getenv("TG_LOGIN_BOT_TOKEN", BOT_TOKEN)
# ВАЖНО: после Фазы 2 сессиями владеет Next.js (web/) — этот ключ нужен только боту,
# пока какие-то его эндпоинты выпускают/проверяют JWT.
JWT_SECRET_KEY = hashlib.sha256(TG_LOGIN_BOT_TOKEN.encode("utf-8")).digest() if TG_LOGIN_BOT_TOKEN else b""
MINIAPP_URL = os.getenv("MINIAPP_URL", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
if not OPENAI_BASE_URL:
    OPENAI_BASE_URL = (
        "https://openrouter.ai/api/v1"
        if OPENAI_API_KEY.startswith("sk-or-")
        else "https://api.openai.com/v1"
    )

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")
YOOKASSA_RETURN_URL = os.getenv("YOOKASSA_RETURN_URL", "")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
# URL Next.js-сайта (web/) — задаётся через env, никакого хардкода домена.
SITE_URL = os.getenv("SITE_URL", "")

# ======================== DATABASE ========================
# Railway may provide postgres:// URL — auto-convert to postgresql+asyncpg://
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    # sqlalchemy 2.0: replace driver scheme if missing
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

REVIEW_CHANNEL_URL = os.getenv("REVIEW_CHANNEL_URL", "")
# Telegram user id администраторов (через запятую). Роль admin/owner в БД ставится по этому списку.
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]

# ======================== SERVER-SIDE CATALOG ========================
PRODUCT_PRICES_KOPECKS: dict[str, int] = {
    "dawn-runner-tee": 499000,
    "concrete-shade-hoodie": 899000,
    "shadow-track-pants": 599000,
    "struggle-cap": 349000,
    "steel-heart-tank": 399000,
    "night-shift-joggers": 699000,
    "dawnbreak-bomber": 1499000,
    "urban-grip-socks": 179000,
    "battle-crossbody": 549000,
    "iron-grip-wraps": 219000,
    "void-long-sleeve": 599000,
    "grit-cargo-pants": 849000,
}

PROMO_CODES: dict[str, int] = {
    "SOULDAWN10": 10,
    "FIRST15": 15,
    "VIP20": 20,
}
