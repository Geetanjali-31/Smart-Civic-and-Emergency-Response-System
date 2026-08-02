import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'sevasetu.db')
print(f"Connecting to: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM notifications")
count_before = cursor.fetchone()[0]
print(f"Notifications before: {count_before}")

cursor.execute("DELETE FROM notifications")
conn.commit()

cursor.execute("SELECT COUNT(*) FROM notifications")
count_after = cursor.fetchone()[0]
print(f"Notifications after: {count_after}")

conn.close()
print("Done! All notifications cleared.")
