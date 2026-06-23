# SOULDAWN

Streetwear-бренд: интернет-магазин + личный кабинет + админ-дашборд + Telegram-бот поддержки.

Монорепозиторий из двух частей, которые делят **одну** базу PostgreSQL:

```
souldawn/
├── web/   # Next.js 14 (App Router) + Prisma — единый backend и UI сайта/кабинета/дашборда
└── bot/   # aiogram 3.x — логика Telegram (FSM, рассылки, тикеты операторам, мини-апп)
```

## Кто чем владеет

| Слой | Где | Примечание |
|---|---|---|
| Схема БД (единый источник истины) | `web/prisma/` | миграции + типы |
| HTTP API (auth, orders, admin, payment) | `web/app/api/*` | весь backend здесь |
| Личный кабинет, витрина, админ-дашборд | `web/app/*` | один UI для сайта |
| Telegram Web App (облегчённая версия) | `bot/miniapp/` | авто-логин по `initData` на сайт |
| Telegram-логика (бот) | `bot/` | звонит в `web/` по HTTP, пишет в ту же БД |

## Быстрый старт (локально)

### База
Нужен PostgreSQL. Локально:
```bash
createdb souldawn
```

### web/
```bash
cd web
cp .env.local.example .env.local   # заполни TELEGRAM_BOT_TOKEN, JWT_SECRET, DATABASE_URL
npm install
npx prisma generate
npx prisma migrate deploy          # применить миграции
npm run dev                        # http://localhost:3000
```

### bot/
```bash
cd bot
cp .env.example .env               # заполни BOT_TOKEN, DATABASE_URL, ADMIN_IDS, SITE_URL
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

## Деплой (Railway monorepo)

Один репозиторий, **два сервиса** + одна общая PostgreSQL.

1. **PostgreSQL** — добавь плагин Postgres в проект Railway. Он задаёт `DATABASE_URL`.
2. **Сервис `web`** — Root Directory: `web`, builder **Dockerfile** (`web/Dockerfile`).
   На старте `web/start.sh` сам применяет миграции (`prisma migrate deploy`),
   затем поднимает standalone-сервер Next.js на `$PORT`.
3. **Сервис `bot`** — Root Directory: `bot`, builder **Dockerfile** (`bot/Dockerfile`),
   start `bash start.sh`.

### Переменные окружения

**web** (Next.js):
| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | общая Postgres (Reference на плагин) |
| `TELEGRAM_BOT_TOKEN` | тот же токен бота — для верификации Telegram-авторизации |
| `JWT_SECRET` | секрет сессий сайта (`openssl rand -base64 32`) |
| `ADMIN_IDS` | telegram id админов через запятую |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | username бота (для Login Widget) |
| `NEXT_PUBLIC_SITE_URL` | публичный URL сайта |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL` | оплата (опц.) |
| `WEBHOOK_SECRET` | проверка вебхука YooKassa (опц.) |

**bot** (aiogram):
| Переменная | Назначение |
|---|---|
| `BOT_TOKEN` | токен бота от @BotFather |
| `DATABASE_URL` | та же Postgres, что у web |
| `ADMIN_IDS` | telegram id админов через запятую |
| `SITE_URL` | URL сервиса `web` (бот открывает мини-апп/сайт, шлёт `?site=`) |
| `MINIAPP_URL` | URL мини-аппа (GitHub Pages), если используется |
| `SUPPORT_CHAT_ID` | чат операторов для тикетов |

### Мини-апп (GitHub Pages)
`bot/miniapp/index.html` раздаётся через GitHub Pages. Он авторизуется по
Telegram `initData` против `web` (`/api/auth/mini-app`, Bearer-токен) и должен
знать URL сайта — бот передаёт его через `?site=<NEXT_PUBLIC_SITE_URL>` при
открытии WebApp.

### Оплата
YooKassa webhook настраивается на `https://<web>/api/webhook/yookassa`. Сайт
пишет заказ в БД, бот фоново подтверждает оплаченные заказы и уведомляет клиента.

## Безопасность

- **Никаких секретов в коде/истории.** Все токены/ключи — через env.
- Telegram-авторизация: два потока — Login Widget (`SHA256(token)`) для обычного сайта и Mini App `initData` (`HMAC(token, "WebAppData")`) для Telegram WebApp. Проверка свежести `auth_date`.
- Доступ к `/admin/*` — серверная проверка роли по JWT, без клиентских заголовков.

> ⚠️ Старые репозитории `souldawn` и `souldawn-support-bot` содержали захардкоженные токен бота и JWT-секрет. После перехода на этот монорепо **обязательно перевыпусти токен в @BotFather** (`/revoke` или `/token`) и сгенерируй новый `JWT_SECRET`.

## Структура развёрнута — см. `web/README.md` и `bot/README.md`.
