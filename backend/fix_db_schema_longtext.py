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
        print("Changing image_url to LONGTEXT...")
        # MEDIUMTEXT is up to 16MB, LONGTEXT is up to 4GB. LONGTEXT is safest for base64 images.
        connection.execute(text("ALTER TABLE service_requests MODIFY image_url LONGTEXT"))
        connection.commit()
        print("Schema update completed successfully! image_url is now LONGTEXT.")
        
except Exception as e:
    print(f"FAILED: {str(e)}")
