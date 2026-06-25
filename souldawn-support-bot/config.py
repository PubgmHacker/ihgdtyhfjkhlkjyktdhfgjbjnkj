"""SOULDAWN Support Bot — Configuration."""
from __future__ import annotations
import os

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))

# AI assistant (OpenRouter / OpenAI)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
if not OPENAI_BASE_URL:
    OPENAI_BASE_URL = (
        "https://openrouter.ai/api/v1"
        if OPENAI_API_KEY.startswith("sk-or-")
        else "https://api.openai.com/v1"
    )
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Admin IDs
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]

# Database (auto-convert to asyncpg)
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Support operator chat IDs
raw_ids = os.getenv("SUPPORT_CHAT_ID", "")
SUPPORT_CHAT_IDS = [int(i.strip()) for i in raw_ids.split(",") if i.strip()]

# Web site URL (for API calls)
SITE_URL = os.getenv("SITE_URL", "")

# Support Mini App URL
SUPPORT_MINIAPP_URL = os.getenv("SUPPORT_MINIAPP_URL", "")

# Main bot Mini App URL (for catalog link)
MINIAPP_URL = os.getenv("MINIAPP_URL", "")

# Webhook secret for YooKassa (not used in support bot, kept for compatibility)
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

# AI auto-respond toggle (admins can change at runtime)
AI_AUTO_RESPOND = os.getenv("AI_AUTO_RESPOND", "true").lower() == "true"

# All admin+operator IDs combined
ALL_OPERATOR_IDS = list(set(ADMIN_IDS + SUPPORT_CHAT_IDS))