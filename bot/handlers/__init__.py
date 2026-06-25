"""SOULDAWN — Handlers package. Export all routers."""
from handlers.main_menu import router as main_menu_router
from handlers.admin import router as admin_router
from handlers.payments import router as payments_router

all_routers = [main_menu_router, admin_router, payments_router]


from .admin_panel_trigger import router as admin_trigger_router
all_routers.append(admin_trigger_router)
