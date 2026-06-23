"""SOULDAWN Bot — Entry point: Bot, Dispatcher, middleware, routers, aiohttp web server."""
from __future__ import annotations

import asyncio
import logging
import sys
import time

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand
from aiohttp import web

from config import BOT_TOKEN, WEBHOOK_PORT, OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL, YOOKASSA_SHOP_ID
from database import init_db, set_bot, dispose_db
from handlers import all_routers
from handlers.api_web import create_web_app
from handlers.payments import poll_paid_orders
from middlewares.registration import RegistrationMiddleware

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("SOULDAWN")


async def cleanup_pending_orders():
    """Remove pending orders older than 30 minutes."""
    while True:
        await asyncio.sleep(300)
        now = time.time()
        from handlers.payments import pending_orders
        expired = [pid for pid, o in pending_orders.items()
                   if o["status"] == "pending" and now - o["created_at"] > 1800]
        for pid in expired:
            del pending_orders[pid]
            logger.info(f"Cleaned up expired order: {pid}")


async def main():
    bot = Bot(token=BOT_TOKEN)
    set_bot(bot)

    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Register middleware
    dp.update.outer_middleware(RegistrationMiddleware())

    # Include all routers
    dp.include_routers(*all_routers)

    # Init database
    await init_db()
    from database.connection import async_session_factory
    logger.info(f"DB status: {'connected' if async_session_factory else 'DISABLED'}")

    # Set bot commands
    await bot.set_my_commands([
        BotCommand(command="start", description="Main menu"),
        BotCommand(command="help", description="Help"),
        BotCommand(command="catalog", description="Catalog"),
        BotCommand(command="order", description="My order"),
        BotCommand(command="sizes", description="Size chart"),
        BotCommand(command="admin", description="Admin panel"),
    ])

    logger.info("SOULDAWN Bot started!")
    if OPENAI_API_KEY:
        logger.info(f"AI: {OPENAI_MODEL} via {OPENAI_BASE_URL.split('/')[2]}")
    else:
        logger.warning("AI disabled")
    if YOOKASSA_SHOP_ID:
        logger.info(f"YooKassa: shop_id={YOOKASSA_SHOP_ID[:6]}...")
    else:
        logger.warning("YooKassa not configured")

    # Start minimal health server (Railway healthcheck only)
    app = create_web_app(bot)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", WEBHOOK_PORT)
    await site.start()
    logger.info(f"Health server: port {WEBHOOK_PORT}")

    # Start background tasks
    asyncio.create_task(cleanup_pending_orders())
    # Подтверждение оплаченных заказов из БД (Next.js webhook ставит 'paid').
    asyncio.create_task(poll_paid_orders(bot))

    # Start polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN not set. Export BOT_TOKEN env variable and restart.")
        sys.exit(1)
    asyncio.run(main())
