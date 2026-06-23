"""SOULDAWN Support Bot — Configuration."""
from __future__ import annotations

import os

# ======================== ENV VARS ========================
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
raw_ids = os.getenv("SUPPORT_CHAT_ID", "520904288,1195137911,8340654471,8735560311")
SUPPORT_CHAT_IDS = [int(i.strip()) for i in raw_ids.split(",") if i.strip()]
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
SITE_URL = os.getenv("SITE_URL", "")

# ======================== DATABASE ========================
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Telegram user id администраторов (через запятую)
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]
