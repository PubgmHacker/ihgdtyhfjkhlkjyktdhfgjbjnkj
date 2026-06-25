from aiogram import Router
from .support import router as support_router
from .admin import router as admin_router

all_routers = [
    admin_router,
    support_router,
]