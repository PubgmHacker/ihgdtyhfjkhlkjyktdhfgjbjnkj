"""SOULDAWN Support Bot — stub.

Support bot does NOT handle payments — all payments go through the main bot
and the Next.js web app (/api/create-payment, /api/webhook/yookassa).
This file exists to prevent import errors from leftover code.
"""
from aiogram import Router

router = Router()
# No handlers — support bot is not a payment processor.