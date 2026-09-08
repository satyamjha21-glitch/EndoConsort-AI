from database import test_connection


if __name__ == "__main__":
    database_name = test_connection()

    print("Database connection: OK")
    print("Connected database:", database_name)