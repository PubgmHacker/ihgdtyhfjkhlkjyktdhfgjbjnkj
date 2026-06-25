"""SOULDAWN Support Bot — stub.

All REST API moved to Next.js (web/app/api/). The support bot only runs
a health-check aiohttp server (see bot.py). This file exists to prevent
import errors from leftover code.
"""
from aiogram import Router

router = Router()
# No handlers — all REST endpoints are in Next.js.