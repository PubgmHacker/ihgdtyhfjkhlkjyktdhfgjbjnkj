"""SOULDAWN Support Bot — Entry point."""
from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand, BotCommandScopeDefault, BotCommandScopeChat
from aiohttp import web

from config import BOT_TOKEN, WEBHOOK_PORT, ADMIN_IDS, ALL_OPERATOR_IDS
from database import init_db, set_bot
from handlers import all_routers
from middlewares.registration import RegistrationMiddleware

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("SOULDAWN.support")


async def main():
    bot = Bot(token=BOT_TOKEN)
    set_bot(bot)

    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Register middleware
    dp.message.middleware(RegistrationMiddleware())
    dp.callback_query.middleware(RegistrationMiddleware())

    # Register routers: admin first (catches /admin, /debug), then support
    dp.include_routers(*all_routers)

    await init_db()

    # Public commands (visible to all users)
    public_commands = [
        BotCommand(command="start",   description="Главное меню"),
        BotCommand(command="tickets", description="Мои обращения"),
        BotCommand(command="new",     description="Новое обращение оператору"),
    ]
    await bot.set_my_commands(public_commands, scope=BotCommandScopeDefault())

    # Admin+operator commands
    admin_commands = public_commands + [
        BotCommand(command="admin",  description="Панель оператора"),
        BotCommand(command="debug",  description="Диагностика системы"),
    ]
    for _aid in ALL_OPERATOR_IDS:
        try:
            await bot.set_my_commands(
                admin_commands, scope=BotCommandScopeChat(chat_id=_aid)
            )
        except Exception as e:
            logger.warning(f"Failed to set commands for {_aid}: {e}")

    logger.info("SOULDAWN Support Bot started!")
    logger.info(f"Admins: {ADMIN_IDS}")
    logger.info(f"Operators: {ALL_OPERATOR_IDS}")

    # Health server for Railway
    async def health(request):
        return web.json_response({
            "status": "ok",
            "service": "souldawn-support-bot",
        })

    app = web.Application()
    app.router.add_get("/health", health)
    app.router.add_get("/", health)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", WEBHOOK_PORT)
    await site.start()
    logger.info(f"Health server: port {WEBHOOK_PORT}")

    await dp.start_polling(bot)


if __name__ == "__main__":
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN not set.")
        sys.exit(1)
    asyncio.run(main())