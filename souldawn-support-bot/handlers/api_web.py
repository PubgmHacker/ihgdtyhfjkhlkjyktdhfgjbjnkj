"""SOULDAWN — aiohttp web server: all REST endpoints + security middleware."""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timezone, timedelta

import jwt
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiohttp import web
from aiohttp.web import middleware

from config import (
    WEBHOOK_SECRET, SUPPORT_CHAT_IDS, MINIAPP_URL,
    PRODUCT_PRICES_KOPECKS, PROMO_CODES, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, ADMIN_IDS,
    TG_LOGIN_BOT_TOKEN, JWT_SECRET_KEY,
)
from database import (
    get_or_create_user, get_user_cart, save_user_cart,
    save_order, get_user_orders, get_all_users,
    get_full_stats, update_user_heartbeat, get_online_users,
    get_recent_orders, add_expense, get_expenses, delete_expense,
    update_user_notifications,
    get_ticket, take_ticket as db_take_ticket, get_open_tickets,
    update_ticket_status, close_ticket,
)
import database.connection as _db_conn
from utils import _fmt_price
from services.yookassa import create_yookassa_payment, check_yookassa_payment

logger = logging.getLogger("SOULDAWN")


# ======================== RATE LIMITING ========================
_rate_buckets: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 30


def _get_client_ip(request: web.Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote or "unknown"


@middleware
async def security_middleware(request: web.Request, handler):
    ip = _get_client_ip(request)
    now = time.time()

    bucket = _rate_buckets.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < RATE_LIMIT_WINDOW]
    if len(bucket) >= RATE_LIMIT_MAX:
        return web.json_response({"error": "Too many requests"}, status=429)
    bucket.append(now)

    content_length = request.headers.get("Content-Length", "0")
    try:
        if int(content_length) > 1_000_000:
            return web.json_response({"error": "Request too large"}, status=413)
    except ValueError:
        pass

    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Id, Authorization"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


async def options_handler(request: web.Request) -> web.Response:
    return web.Response(status=204)


# ======================== YOOKASSA WEBHOOK ========================

async def webhook_handler(request: web.Request) -> web.Response:
    auth_header = request.headers.get("Authorization", "")
    if WEBHOOK_SECRET:
        expected = f"Bearer {WEBHOOK_SECRET}"
        if auth_header != expected:
            logger.warning("Webhook: invalid signature, rejecting")
            return web.Response(status=403, text="Forbidden")

    try:
        data = await request.json()
    except Exception:
        return web.Response(status=400, text="Invalid JSON")

    event = data.get("event")
    payment_obj = data.get("object", {})
    payment_id = payment_obj.get("id")
    status = payment_obj.get("status")

    logger.info(f"YooKassa webhook: event={event} payment={payment_id} status={status}")

    from handlers.payments import pending_orders
    bot = request.app["bot"]

    if event == "payment.succeeded" and payment_id:
        order = pending_orders.get(payment_id)
        if not order:
            logger.warning(f"Webhook: order {payment_id} not found in pending_orders")
            return web.Response(status=200)

        if order["status"] == "succeeded":
            logger.info(f"Webhook: order {payment_id} already confirmed")
            return web.Response(status=200)

        order["status"] = "succeeded"

        # Verify amount
        paid_amount = payment_obj.get("amount", {}).get("value", "0")
        paid_kopecks = int(round(float(paid_amount) * 100))
        expected_kopecks = order["total_kopecks"]
        if paid_kopecks != expected_kopecks:
            logger.error(
                f"Webhook: AMOUNT MISMATCH! paid={paid_kopecks} "
                f"expected={expected_kopecks} payment={payment_id}"
            )
            order["amount_mismatch"] = True

        # Update DB via SQLAlchemy
        if _db_conn.async_session_factory and order.get("order_id"):
            try:
                async with _db_conn.async_session_factory() as session:
                    from sqlalchemy import update
                    from database.models import Order as OrderModel
                    await session.execute(
                        update(OrderModel)
                        .where(OrderModel.id == order["order_id"])
                        .values(status="paid", yookassa_id=payment_id)
                    )
                    await session.commit()
            except Exception as e:
                logger.error(f"Webhook: DB update error: {e}")

        user_id = order["user_id"]
        display_name = order.get("display_name", "—")
        username = order.get("username", "—")
        items = order["items"]
        total_kopecks = order["total_kopecks"]
        contact = order.get("contact", {})
        payment_method = order.get("payment_method", "unknown")
        promo_code = order.get("promo_code", "")
        discount_kopecks = order.get("discount_kopecks", 0)
        amount_mismatch = order.get("amount_mismatch", False)

        method_names = {"card": "Card", "sbp": "SBP", "wallet": "Telegram Wallet"}
        method_str = method_names.get(payment_method, payment_method)
        phone = contact.get("phone", "—")
        name = contact.get("name", "—")

        lines = []
        for i, it in enumerate(items, 1):
            it_name = it.get("name", it.get("id", "?"))
            qty = it.get("qty", 1)
            price = it.get("price", 0)
            lines.append(f"{i}. {it_name} x{qty} - {_fmt_price(price * 100)}")

        promo_line = ""
        if promo_code:
            promo_line = f"Promo: {promo_code} (-{_fmt_price(discount_kopecks)})\n"

        mismatch_line = ""
        if amount_mismatch:
            mismatch_line = "\nWARNING: PAYMENT AMOUNT DOES NOT MATCH ORDER!"

        order_text = (
            f"SOULDAWN - Paid order\n\n"
            f"Buyer: {display_name} - ID: {user_id}\n"
            f"Username: {username}\n\n"
            f"Items:\n" + "\n".join(lines) + f"\n\n"
            f"{promo_line}"
            f"Total: {_fmt_price(total_kopecks)}\n"
            f"Method: {method_str}\n\n"
            f"Phone: {phone}\n"
            f"Name: {name}\n\n"
            f"Payment confirmed via YooKassa"
            f"{mismatch_line}"
        )

        if SUPPORT_CHAT_ID:
            try:
                await bot.send_message(
                    SUPPORT_CHAT_IDS,
                    order_text,
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                        InlineKeyboardButton(text="REPLY", url=f"tg://user?id={user_id}")
                    ]]),
                )
            except Exception as e:
                logger.error(f"Webhook: error forwarding to operator: {e}")

        if user_id > 0:
            try:
                from texts import pay_confirmed_text
                await bot.send_message(
                    user_id,
                    pay_confirmed_text(total_kopecks),
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="SHOP", web_app=WebAppInfo(url=MINIAPP_URL))],
                        [InlineKeyboardButton(text="MENU", callback_data="back_to_menu")],
                    ]),
                )
            except Exception as e:
                logger.error(f"Webhook: error notifying user {user_id}: {e}")

        logger.info(f"Webhook: order {payment_id} confirmed, forwarded to operator")

    elif event == "payment.canceled" and payment_id:
        order = pending_orders.get(payment_id)
        if order:
            order["status"] = "canceled"
            if _db_conn.async_session_factory and order.get("order_id"):
                try:
                    async with _db_conn.async_session_factory() as session:
                        from sqlalchemy import update
                        from database.models import Order as OrderModel
                        await session.execute(
                            update(OrderModel)
                            .where(OrderModel.id == order["order_id"])
                            .values(status="cancelled")
                        )
                        await session.commit()
                except Exception as e:
                    logger.error(f"Webhook cancel: DB update error: {e}")

            user_id = order["user_id"]
            if user_id > 0:
                try:
                    await bot.send_message(
                        user_id,
                        "SOULDAWN - Payment cancelled\n\n"
                        "Payment did not go through. Try again.\n"
                        "/start - menu",
                    )
                except Exception:
                    pass
            logger.info(f"Webhook: payment {payment_id} canceled")

    return web.Response(status=200)


# ======================== PAYMENT API ========================

async def create_payment_api(request: web.Request) -> web.Response:
    """POST /api/create-payment — server-side price validation."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    items = data.get("items", [])
    contact = data.get("contact", {})
    user_id_str = data.get("user_id", "web")
    payment_method = data.get("payment_method", "card")
    promo_code = data.get("promo_code", "")

    if not items or not isinstance(items, list):
        return web.json_response({"error": "No items"}, status=400)
    if not contact or not contact.get("phone"):
        return web.json_response({"error": "Phone required"}, status=400)

    # Server-side price validation
    validated_items = []
    total_kopecks = 0
    for item in items:
        item_id = item.get("id", "")
        qty = int(item.get("qty", 1))
        size = item.get("size", "")

        if qty < 1 or qty > 10:
            return web.json_response({"error": f"Invalid quantity: {item_id}"}, status=400)
        if not size or len(size) > 20:
            return web.json_response({"error": f"Invalid size: {item_id}"}, status=400)

        server_price = PRODUCT_PRICES_KOPECKS.get(item_id)
        if server_price is None:
            logger.warning(f"Payment API: unknown product {item_id}")
            return web.json_response({"error": f"Unknown product: {item_id}"}, status=400)

        item_total = server_price * qty
        total_kopecks += item_total
        validated_items.append({
            "id": item_id,
            "name": item.get("name", item_id),
            "size": size,
            "qty": qty,
            "price": server_price,
        })

    if total_kopecks <= 0:
        return web.json_response({"error": "Empty order"}, status=400)

    total_qty = sum(i["qty"] for i in validated_items)
    if total_qty > 50:
        return web.json_response({"error": "Too many items (max 50)"}, status=400)

    # Promo code validation
    discount_kopecks = 0
    if promo_code:
        code = promo_code.strip().upper()
        discount_pct = PROMO_CODES.get(code)
        if discount_pct is None:
            return web.json_response({"error": "Promo code not found"}, status=400)
        discount_kopecks = total_kopecks * discount_pct // 100
        total_kopecks -= discount_kopecks

    # Create YooKassa payment
    items_summary = ", ".join([it["name"] for it in validated_items[:3]])
    if len(validated_items) > 3:
        items_summary += f" and {len(validated_items) - 3} more"
    description = f"SOULDAWN: {items_summary}"

    metadata = {
        "user_id": user_id_str,
        "source": "website",
        "items": json.dumps(validated_items, ensure_ascii=False),
        "contact": json.dumps(contact, ensure_ascii=False),
    }
    if promo_code:
        metadata["promo"] = promo_code.strip().upper()
        metadata["discount"] = str(discount_kopecks)

    payment = await create_yookassa_payment(total_kopecks, description, metadata)

    if payment is None:
        return web.json_response({"error": "Payment system unavailable. Try later."}, status=503)

    # Save to DB
    order_id = None
    try:
        order_id = await save_order(
            user_id=int(user_id_str) if user_id_str.isdigit() else 0,
            items=validated_items,
            total=total_kopecks,
            yookassa_id=payment["id"],
            contact=contact,
        )
    except Exception as e:
        logger.error(f"Payment API: save_order error: {e}")

    from handlers.payments import pending_orders
    pending_orders[payment["id"]] = {
        "user_id": int(user_id_str) if user_id_str.isdigit() else 0,
        "display_name": contact.get("name", "Website User"),
        "username": contact.get("email", ""),
        "items": validated_items,
        "total_kopecks": total_kopecks,
        "total_rub": total_kopecks // 100,
        "contact": contact,
        "payment_method": payment_method,
        "promo_code": promo_code.strip().upper() if promo_code else "",
        "discount_kopecks": discount_kopecks,
        "order_id": order_id,
        "status": "pending",
        "created_at": time.time(),
    }

    logger.info(
        f"Payment API: created {payment['id']} for {user_id_str}, "
        f"{len(validated_items)} items, {total_kopecks}k, promo={promo_code or 'none'}"
    )

    return web.json_response({
        "payment_id": payment["id"],
        "confirmation_url": payment["confirmation_url"],
        "status": payment["status"],
        "total_kopecks": total_kopecks,
    })


async def api_check_payment(request: web.Request) -> web.Response:
    """GET /api/check-payment/{payment_id}"""
    payment_id = request.match_info.get("payment_id", "")
    if not payment_id:
        return web.json_response({"error": "No payment_id"}, status=400)

    result = await check_yookassa_payment(payment_id)
    if result:
        return web.json_response({
            "payment_id": payment_id,
            "status": result.get("status", "unknown"),
            "amount": result.get("amount", {}),
        })

    from handlers.payments import pending_orders
    order = pending_orders.get(payment_id)
    if order:
        return web.json_response({
            "payment_id": payment_id,
            "status": order["status"],
            "amount": {"value": f"{order['total_kopecks'] / 100:.2f}", "currency": "RUB"},
        })

    return web.json_response({"error": "Payment not found"}, status=404)


async def api_validate_promo(request: web.Request) -> web.Response:
    """POST /api/validate-promo"""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    code = (data.get("code") or "").strip().upper()
    total = int(data.get("total", 0))

    if not code:
        return web.json_response({"error": "Enter promo code"}, status=400)

    discount_pct = PROMO_CODES.get(code)
    if discount_pct is None:
        return web.json_response({"valid": False, "error": "Promo code not found"})

    discount_kopecks = total * discount_pct // 100

    return web.json_response({
        "valid": True,
        "code": code,
        "discount_percent": discount_pct,
        "discount_kopecks": discount_kopecks,
        "total_after_discount": total - discount_kopecks,
    })


# ======================== HEALTH ========================

async def health_check(request: web.Request) -> web.Response:
    from handlers.payments import pending_orders
    return web.json_response({
        "status": "ok",
        "pending_orders": len(pending_orders),
        "yookassa_configured": bool(YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY),
        "db_connected": _db_conn.async_session_factory is not None,
    })


# ======================== TELEGRAM LOGIN WIDGET AUTH ========================

JWT_COOKIE_NAME = "souldawn_token"
JWT_EXPIRY_HOURS = 24
AUTH_DATE_MAX_SECONDS = 3600  # 1 hour (Telegram recommends max 86400)


def _verify_telegram_hash(data: dict) -> bool:
    """
    Verify Telegram Login Widget signature per official docs:
    https://core.telegram.org/widgets/login#checking-authorization

    1. Extract 'hash' from the data.
    2. Collect all other fields as 'key=value', sort by key, join with '\\n'.
    3. Compute HMAC-SHA256(secret_key, data_check_string) and compare with hash.
    """
    received_hash = data.get("hash", "")
    if not received_hash or len(received_hash) != 64:
        return False

    # Build data check string: all fields except 'hash', sorted by key
    data_check_list = []
    for key, value in sorted(data.items()):
        if key == "hash":
            continue
        data_check_list.append(f"{key}={value}")
    data_check_string = "\n".join(data_check_list)

    # HMAC-SHA256
    secret_key = hashlib.sha256(TG_LOGIN_BOT_TOKEN.encode("utf-8")).digest()
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_hash, received_hash)


def _make_jwt(telegram_id: int, username: str, name: str, photo_url: str) -> str:
    """Create a signed JWT token."""
    payload = {
        "telegram_id": telegram_id,
        "username": username,
        "name": name,
        "photo_url": photo_url,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def _decode_jwt(token: str) -> dict | None:
    """Decode and verify JWT. Returns payload or None."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def _get_auth_token(request: web.Request) -> str | None:
    """Extract JWT from cookie OR Authorization header (for cross-origin proxy)."""
    # Try cookie first (same-origin)
    token = request.cookies.get(JWT_COOKIE_NAME)
    if token:
        return token
    # Try Authorization header (cross-origin proxy)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


async def api_auth_telegram(request: web.Request) -> web.Response:
    """
    POST /api/auth/telegram — Telegram Login Widget OAuth callback.

    Accepts JSON: {id, first_name, last_name, username, photo_url, auth_date, hash}
    Verifies HMAC-SHA256 signature, creates/updates user, returns JWT cookie.
    """
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"success": False, "message": "Invalid JSON"}, status=400)

    # --- Step 1: Extract hash ---
    received_hash = data.get("hash")
    if not received_hash:
        return web.json_response(
            {"success": False, "message": "Missing hash"}, status=400
        )

    # --- Step 2: Verify HMAC-SHA256 signature ---
    if not _verify_telegram_hash(data):
        logger.warning("Auth: invalid Telegram hash")
        return web.json_response(
            {"success": False, "message": "Invalid signature"}, status=401
        )

    # --- Step 3: Validate auth_date (max 1 hour old) ---
    auth_date_str = data.get("auth_date", "0")
    try:
        auth_date = int(auth_date_str)
    except (ValueError, TypeError):
        return web.json_response(
            {"success": False, "message": "Invalid auth_date"}, status=401
        )

    now = int(time.time())
    if now - auth_date > AUTH_DATE_MAX_SECONDS:
        logger.warning(
            f"Auth: expired auth_date (age={now - auth_date}s, max={AUTH_DATE_MAX_SECONDS}s)"
        )
        return web.json_response(
            {"success": False, "message": "Authorization expired. Try again."},
            status=401,
        )

    # --- Step 4: Extract user data ---
    telegram_id = int(data.get("id", 0))
    if telegram_id <= 0:
        return web.json_response(
            {"success": False, "message": "Invalid user id"}, status=400
        )

    username = data.get("username", "")
    first_name = data.get("first_name", "")
    last_name = data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or first_name or username or str(telegram_id)
    photo_url = data.get("photo_url", "")

    # --- Step 5: Create/update user in DB ---
    user = await get_or_create_user(telegram_id, username, full_name)

    # Increment site_sessions
    if _db_conn.async_session_factory and user.get("id"):
        try:
            async with _db_conn.async_session_factory() as session:
                from sqlalchemy import update
                from database.models import User as UserModel
                await session.execute(
                    update(UserModel)
                    .where(UserModel.telegram_id == telegram_id)
                    .values(site_sessions=(UserModel.site_sessions + 1))
                )
                await session.commit()
        except Exception as e:
            logger.error(f"Auth: failed to increment site_sessions: {e}")

    # --- Step 6: Generate JWT ---
    token = _make_jwt(telegram_id, username, full_name, photo_url)

    # --- Step 7: Set cookie + return ---
    is_admin = user.get("is_admin", False) or telegram_id in ADMIN_IDS

    response = web.json_response({
        "success": True,
        "user": {
            "id": user.get("id"),
            "telegram_id": telegram_id,
            "username": username,
            "name": full_name,
            "photo_url": photo_url,
            "is_admin": is_admin,
            "notify_new_drops": user.get("notify_new_drops", True),
            "notify_promos": user.get("notify_promos", True),
        },
    })

    # Set HttpOnly cookie (not accessible from JS)
    response.set_cookie(
        JWT_COOKIE_NAME,
        token,
        max_age=JWT_EXPIRY_HOURS * 3600,
        httponly=True,
        samesite="Lax",
        secure=True,
        path="/",
    )

    logger.info(f"Auth: user {telegram_id} (@{username}) logged in via widget")
    return response


async def api_auth_me(request: web.Request) -> web.Response:
    """GET /api/auth/me — Check current session via JWT cookie."""
    token = _get_auth_token(request)
    if not token:
        return web.json_response(
            {"authenticated": False}, status=401
        )

    payload = _decode_jwt(token)
    if not payload:
        return web.json_response(
            {"authenticated": False, "message": "Invalid or expired token"}, status=401
        )

    telegram_id = payload.get("telegram_id")
    username = payload.get("username", "")
    name = payload.get("name", "")
    photo_url = payload.get("photo_url", "")
    is_admin = telegram_id in ADMIN_IDS

    return web.json_response({
        "authenticated": True,
        "user": {
            "telegram_id": telegram_id,
            "username": username,
            "name": name,
            "photo_url": photo_url,
            "is_admin": is_admin,
        },
    })


async def api_auth_logout(request: web.Request) -> web.Response:
    """POST /api/auth/logout — Clear JWT cookie."""
    response = web.json_response({"success": True})
    response.del_cookie(
        JWT_COOKIE_NAME,
        path="/",
    )
    logger.info("Auth: user logged out")
    return response


# ======================== USER & CART API ========================

async def api_get_user(request: web.Request) -> web.Response:
    """GET /api/user/{telegram_id}"""
    try:
        telegram_id = int(request.match_info["telegram_id"])
    except (ValueError, KeyError):
        return web.json_response({"error": "Invalid telegram_id"}, status=400)

    user = await get_or_create_user(telegram_id)
    return web.json_response({
        "id": user.get("id"),
        "telegram_id": user["telegram_id"],
        "username": user.get("username", ""),
        "name": user.get("name", ""),
        "is_admin": user.get("is_admin", False) or telegram_id in ADMIN_IDS,
        "notify_new_drops": user.get("notify_new_drops", True),
        "notify_promos": user.get("notify_promos", True),
    })


async def api_get_cart(request: web.Request) -> web.Response:
    """GET /api/cart/{user_id}"""
    user_id = request.match_info["user_id"]
    items = await get_user_cart(user_id)
    return web.json_response({"items": items})


async def api_save_cart(request: web.Request) -> web.Response:
    """POST /api/cart/{user_id}"""
    user_id = request.match_info["user_id"]
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    items = data.get("items", [])
    await save_user_cart(user_id, items)
    return web.json_response({"ok": True})


async def api_get_orders(request: web.Request) -> web.Response:
    """GET /api/orders/{user_id}"""
    user_id = request.match_info["user_id"]
    orders = await get_user_orders(user_id)
    return web.json_response({"orders": orders})


# ======================== SITE REGISTRATION ========================

async def api_site_register(request: web.Request) -> web.Response:
    """POST /api/site/register"""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    telegram_id = data.get("telegram_id")
    username = data.get("username", "")
    name = data.get("name", "")
    photo_url = data.get("photo_url", "")

    if not telegram_id or not isinstance(telegram_id, int):
        return web.json_response({"error": "Invalid telegram_id"}, status=400)

    user = await get_or_create_user(telegram_id, username, name)
    return web.json_response({
        "id": user.get("id"),
        "telegram_id": user["telegram_id"],
        "username": user.get("username", ""),
        "name": user.get("name", ""),
        "is_admin": user.get("is_admin", False) or telegram_id in ADMIN_IDS,
        "notify_new_drops": user.get("notify_new_drops", True),
        "notify_promos": user.get("notify_promos", True),
        "photo_url": photo_url,
    })


# ======================== ADMIN API ========================

def _check_admin(request: web.Request) -> bool:
    try:
        admin_id = int(request.headers.get("X-Admin-Id", "0"))
    except (ValueError, TypeError):
        return False
    return admin_id in ADMIN_IDS


async def api_admin_users(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    if not _db_conn.async_session_factory:
        return web.json_response({"error": "DB not connected"}, status=503)

    async with _db_conn.async_session_factory() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(_db_conn.User).order_by(_db_conn.User.created_at.desc())
        )
        users = result.scalars().all()

    user_list = []
    for u in users:
        user_list.append({
            "id": str(u.id),
            "telegram_id": u.telegram_id,
            "username": u.username or "",
            "full_name": u.full_name or "",
            "name": u.full_name or "",
            "is_admin": u.is_admin,
            "notify_new_drops": u.notify_new_drops,
            "notify_promos": u.notify_promos,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None,
            "site_sessions": u.site_sessions or 0,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return web.json_response({"users": user_list, "count": len(user_list)})


async def api_admin_broadcast(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    text = data.get("text", "").strip()
    target = data.get("target", "all")

    if not text:
        return web.json_response({"error": "Text required"}, status=400)

    user_ids = await get_all_users(target)
    if not user_ids:
        return web.json_response({"ok": True, "sent": 0, "message": "No users"})

    bot = request.app["bot"]
    sent = 0
    for uid in user_ids:
        try:
            await bot.send_message(uid, text)
            sent += 1
            await asyncio.sleep(0.05)
        except Exception:
            pass

    if _db_conn.async_session_factory:
        async with _db_conn.async_session_factory() as session:
            bc = _db_conn.Broadcast(text=text, target=target, sent_count=sent)
            session.add(bc)
            await session.commit()

    return web.json_response({"ok": True, "sent": sent, "total": len(user_ids)})


async def api_admin_notify(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    text = data.get("text", "").strip()
    notify_type = data.get("type", "drops")

    if not text:
        return web.json_response({"error": "Text required"}, status=400)

    if notify_type == "drops":
        user_ids = await get_all_users("drops")
    else:
        user_ids = await get_all_users("promos")

    bot = request.app["bot"]
    sent = 0
    for uid in user_ids:
        try:
            await bot.send_message(uid, f"{text}")
            sent += 1
            await asyncio.sleep(0.05)
        except Exception:
            pass

    return web.json_response({"ok": True, "sent": sent})


async def api_admin_stats(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    from handlers.payments import pending_orders
    stats = await get_full_stats(pending_count=len(pending_orders))
    return web.json_response(stats)


async def api_admin_update_notifications(request: web.Request) -> web.Response:
    """POST /api/admin/notifications — update user notification prefs (no admin check)."""
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    telegram_id = data.get("telegram_id")
    if not telegram_id:
        return web.json_response({"error": "telegram_id required"}, status=400)

    kwargs = {}
    if "notify_new_drops" in data:
        kwargs["notify_new_drops"] = bool(data["notify_new_drops"])
    if "notify_promos" in data:
        kwargs["notify_promos"] = bool(data["notify_promos"])

    await update_user_notifications(telegram_id, **kwargs)
    return web.json_response({"ok": True})


async def api_admin_heartbeat(request: web.Request) -> web.Response:
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    telegram_id = data.get("telegram_id")
    if not telegram_id:
        return web.json_response({"error": "telegram_id required"}, status=400)
    await update_user_heartbeat(telegram_id)
    return web.json_response({"ok": True})


async def api_admin_online(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    online = await get_online_users()
    return web.json_response({"online": online, "count": len(online)})


async def api_admin_full_stats(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    from handlers.payments import pending_orders
    stats = await get_full_stats(pending_count=len(pending_orders))
    return web.json_response(stats)


async def api_admin_recent_orders(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    limit = int(request.query.get("limit", "20"))
    orders = await get_recent_orders(limit)
    return web.json_response({"orders": orders})


async def api_admin_expenses_list(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    expenses = await get_expenses()
    return web.json_response({"expenses": expenses})


async def api_admin_expenses_add(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    category = data.get("category", "other")
    description = data.get("description", "")
    amount = data.get("amount", 0)
    if not isinstance(amount, (int, float)) or amount <= 0:
        return web.json_response({"error": "amount must be positive integer"}, status=400)
    result = await add_expense(category, description, int(amount))
    return web.json_response(result)


async def api_admin_expenses_delete(request: web.Request) -> web.Response:
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    expense_id = request.match_info["id"]
    deleted = await delete_expense(expense_id)
    if deleted:
        return web.json_response({"ok": True})
    return web.json_response({"error": "not found"}, status=404)


# ======================== TICKET API ========================

async def api_admin_tickets(request: web.Request) -> web.Response:
    """GET /api/admin/tickets — list open tickets for admin panel."""
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)
    tickets = await get_open_tickets()
    return web.json_response({"tickets": tickets, "count": len(tickets)})


async def api_admin_ticket_take(request: web.Request) -> web.Response:
    """POST /api/admin/tickets/{id}/take — take ticket in work."""
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)

    ticket_id = request.match_info.get("id", "")
    if not ticket_id:
        return web.json_response({"error": "No ticket id"}, status=400)

    try:
        data = await request.json()
    except Exception:
        data = {}

    admin_id = int(request.headers.get("X-Admin-Id", "0"))
    admin_name = data.get("admin_name", "Admin")

    ticket = await get_ticket(ticket_id)
    if not ticket:
        return web.json_response({"error": "Ticket not found"}, status=404)

    if ticket["status"] not in ("open",):
        return web.json_response({"error": "Ticket already taken"}, status=409)

    success = await db_take_ticket(ticket_id, admin_id, admin_name)
    if not success:
        return web.json_response({"error": "Already taken by another admin"}, status=409)

    return web.json_response({"ok": True, "ticket_id": ticket_id})


async def api_admin_ticket_reply(request: web.Request) -> web.Response:
    """POST /api/admin/tickets/{id}/reply — send reply to user."""
    if not _check_admin(request):
        return web.json_response({"error": "Forbidden"}, status=403)

    ticket_id = request.match_info.get("id", "")
    if not ticket_id:
        return web.json_response({"error": "No ticket id"}, status=400)

    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    reply_text = data.get("text", "").strip()
    if not reply_text:
        return web.json_response({"error": "Reply text required"}, status=400)

    ticket = await get_ticket(ticket_id)
    if not ticket:
        return web.json_response({"error": "Ticket not found"}, status=404)

    user_id = ticket.get("user_id", 0)
    if not user_id:
        return web.json_response({"error": "No user_id in ticket"}, status=500)

    # Send reply to user
    bot = request.app["bot"]
    try:
        await bot.send_message(user_id, f"💬 Ответ от поддержки:\n\n{reply_text}")
    except Exception as e:
        logger.error(f"Ticket reply: failed to send to user {user_id}: {e}")
        return web.json_response({"error": f"Failed to send: {e}"}, status=500)

    # Mark ticket as answered + closed
    admin_id = int(request.headers.get("X-Admin-Id", "0"))
    admin_name_str = data.get("admin_name", "Admin")
    await update_ticket_status(ticket_id, "answered", admin_name_str)
    await close_ticket(ticket_id)

    return web.json_response({"ok": True, "sent_to": user_id})


# ======================== CREATE WEB APP ========================

def create_web_app(bot) -> web.Application:
    """Create aiohttp web application with all routes. Accepts bot instance."""
    app = web.Application(middlewares=[security_middleware])
    app["bot"] = bot

    # YooKassa
    app.router.add_post("/webhook/yookassa", webhook_handler)
    app.router.add_post("/api/create-payment", create_payment_api)
    app.router.add_get("/api/check-payment/{payment_id}", api_check_payment)
    app.router.add_post("/api/validate-promo", api_validate_promo)

    # CORS
    app.router.add_options("/{path:.*}", options_handler)

    # Health
    app.router.add_get("/health", health_check)
    app.router.add_get("/", health_check)

    # Site registration
    app.router.add_post("/api/site/register", api_site_register)

    # Telegram Login Widget Auth
    app.router.add_post("/api/auth/telegram", api_auth_telegram)
    app.router.add_get("/api/auth/me", api_auth_me)
    app.router.add_post("/api/auth/logout", api_auth_logout)

    # User & Cart
    app.router.add_get("/api/user/{telegram_id}", api_get_user)
    app.router.add_get("/api/cart/{user_id}", api_get_cart)
    app.router.add_post("/api/cart/{user_id}", api_save_cart)
    app.router.add_get("/api/orders/{user_id}", api_get_orders)

    # Admin
    app.router.add_get("/api/admin/users", api_admin_users)
    app.router.add_post("/api/admin/broadcast", api_admin_broadcast)
    app.router.add_post("/api/admin/notify", api_admin_notify)
    app.router.add_get("/api/admin/stats", api_admin_stats)
    app.router.add_post("/api/admin/notifications", api_admin_update_notifications)
    app.router.add_post("/api/admin/heartbeat", api_admin_heartbeat)
    app.router.add_get("/api/admin/online", api_admin_online)
    app.router.add_get("/api/admin/full-stats", api_admin_full_stats)
    app.router.add_get("/api/admin/recent-orders", api_admin_recent_orders)
    app.router.add_get("/api/admin/expenses", api_admin_expenses_list)
    app.router.add_post("/api/admin/expenses", api_admin_expenses_add)
    app.router.add_delete("/api/admin/expenses/{id}", api_admin_expenses_delete)

    # Tickets
    app.router.add_get("/api/admin/tickets", api_admin_tickets)
    app.router.add_post("/api/admin/tickets/{id}/take", api_admin_ticket_take)
    app.router.add_post("/api/admin/tickets/{id}/reply", api_admin_ticket_reply)

    return app
