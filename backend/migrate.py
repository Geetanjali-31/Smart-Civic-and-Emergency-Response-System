import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'sevasetu.db')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find table names
tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print("Tables:", tables)

# Find service table (could be 'service_request' or 'servicerequest' etc)
service_table = None
for t in tables:
    if 'service' in t.lower():
        service_table = t
        break

if not service_table:
    print("No service table found!")
    conn.close()
    exit(1)

print(f"Found service table: {service_table}")

# Get current columns
columns = [r[1] for r in cursor.execute(f"PRAGMA table_info({service_table})")]
print("Current columns:", columns)

if 'assigned_to' in columns:
    print("Column 'assigned_to' already exists - no migration needed.")
else:
    cursor.execute(f"ALTER TABLE {service_table} ADD COLUMN assigned_to INTEGER")
    conn.commit()
    print("SUCCESS: Added 'assigned_to' column!")

# Verify
columns_after = [r[1] for r in cursor.execute(f"PRAGMA table_info({service_table})")]
print("Columns after migration:", columns_after)

conn.close()
