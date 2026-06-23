"""SOULDAWN Support Bot — Configuration."""
from __future__ import annotations
import os

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8080"))

# Настройки ИИ-ассистента (OpenRouter / OpenAI)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")

# Настройки администраторов
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip().isdigit()]

# Настройки базы данных с автоподменой на asyncpg
DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Безопасная обработка списка ID поддержки
raw_ids = os.getenv("SUPPORT_CHAT_ID", "520904288,1195137911,8340654471,8735560311")
SUPPORT_CHAT_IDS = [int(i.strip()) for i in raw_ids.split(",") if i.strip()]
