import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('.env')
db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

print(f"Connecting to: {db_url}")

try:
    engine = create_engine(db_url)
    with engine.connect() as connection:
        # Check if table exists
        result = connection.execute(text("SHOW TABLES LIKE 'service_requests'"))
        if not result.fetchone():
            print("Table 'service_requests' does not exist yet.")
            exit(0)
            
        print("Checking for missing columns...")
        
        # We can just run ALTER TABLE ADD COLUMN. If it fails due to duplicate, we catch it.
        try:
            connection.execute(text("ALTER TABLE service_requests ADD COLUMN latitude FLOAT"))
            print("Added latitude column.")
        except Exception as e:
            print("latitude column might already exist.")
            
        try:
            connection.execute(text("ALTER TABLE service_requests ADD COLUMN longitude FLOAT"))
            print("Added longitude column.")
        except Exception as e:
            print("longitude column might already exist.")
            
        connection.commit()
        print("Schema update completed successfully!")
        
except Exception as e:
    print(f"FAILED: {str(e)}")
