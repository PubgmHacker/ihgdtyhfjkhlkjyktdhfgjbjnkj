"""SOULDAWN Support Bot — Handlers package."""
from handlers.support import router as support_router
from handlers.admin  import router as admin_router

all_routers = [support_router, admin_router]

from .admin_panel_trigger import router as admin_trigger_sup_router
all_routers.append(admin_trigger_sup_router)
