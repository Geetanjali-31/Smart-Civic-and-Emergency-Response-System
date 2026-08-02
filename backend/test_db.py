import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

load_dotenv()
db_url = os.environ.get('DATABASE_URL')
print(f"Testing MySQL connection to: {db_url}")

try:
    engine = create_engine(db_url)
    connection = engine.connect()
    print("✅ SUCCESS: Connection to MySQL was completely successful!")
    connection.close()
except OperationalError as e:
    print("\n❌ FAILED: Database connection error encountered.")
    print("="*50)
    print(getattr(e, 'orig', e))
    print("="*50)
    
    error_str = str(getattr(e, 'orig', e))
    if '1045' in error_str:
        print("Diagnosis: Access Denied. Your root user has a password, but we are sending a blank password in .env.")
    elif '1049' in error_str:
        print("Diagnosis: Unknown Database. MySQL is running, but the 'sevasetu' database has not been created in it yet.")
    elif '2003' in error_str:
        print("Diagnosis: Service Not Found. MySQL is either not running, or running on a port other than 3306.")
    else:
        print("Diagnosis: Unknown MySQL configuration error.")
