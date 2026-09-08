import psycopg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    return psycopg.connect(DATABASE_URL)


def test_connection():
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database();")
            result = cur.fetchone()
            return result[0]
    finally:
        conn.close()