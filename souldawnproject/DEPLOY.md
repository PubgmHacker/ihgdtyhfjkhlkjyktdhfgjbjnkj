# SOULDAWN — Инструкция по сборке и деплою

## Фаза 7 — Сборка и пуш

### 1. Подготовка окружения

```bash
cd /Users/hellcart/ZCodeProject/souldawnproject/web
cp .env.local.example .env.local
# Заполни .env.local реальными значениями
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Миграция БД (новые таблицы: Notification, Review)

```bash
npx prisma migrate dev --name add_notifications_reviews
```

### 4. Lint

```bash
npm run lint
```

### 5. Сборка

```bash
npm run build
```

### 6. Пуш на GitLab

```bash
cd /Users/hellcart/ZCodeProject/souldawnproject
git add .
git commit -m "SOULDAWN: полный редизайн + все фазы"
git push gitlab main:souldawnproject
```

---

## Боты

### Main bot

```bash
cd /Users/hellcart/ZCodeProject/souldawnproject/bot
pip install -r requirements.txt
python bot.py
```

### Support bot

```bash
cd /Users/hellcart/ZCodeProject/souldawnproject/bot
# Добавь SUPPORT_BOT_TOKEN в .env
python support_bot.py
```

---

## Нужные env-переменные

| Переменная | Описание |
|---|---|
| `BOT_TOKEN` | Токен main-бота |
| `SUPPORT_BOT_TOKEN` | Токен бота поддержки |
| `TELEGRAM_BOT_TOKEN` | Тот же токен (для web/) |
| `DATABASE_URL` | PostgreSQL URL |
| `JWT_SECRET` | Секрет JWT |
| `ADMIN_IDS` | Telegram ID админов |
| `REVIEW_CHANNEL_USERNAME` | @username группы отзывов |
| `REVIEW_CHANNEL_URL` | Ссылка на группу |
| `WEBHOOK_SECRET` | Секрет для bot→site API |
| `YOOKASSA_SHOP_ID` | YooKassa shop id |
| `YOOKASSA_SECRET_KEY` | YooKassa секрет |
| `NEXT_PUBLIC_TELEGRAM_BOT_NAME` | Username бота (без @) |
| `NEXT_PUBLIC_SITE_URL` | URL сайта |
| `MINIAPP_URL` | URL миниаппа |
| `SITE_URL` | URL сайта (для бота) |
