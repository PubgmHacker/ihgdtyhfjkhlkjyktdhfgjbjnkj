import asyncio
from database.connection import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        for t in ["users", "orders", "expenses"]:
            r = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = :t ORDER BY ordinal_position"
            ), {"t": t})
            cols = [row[0] for row in r]
            print(f"{t}: {cols}")

asyncio.run(main())
