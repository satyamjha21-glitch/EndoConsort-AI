import os
import psycopg
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


def test_connection():
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database();")
            result = cur.fetchone()
            return result[0]
    finally:
        conn.close()