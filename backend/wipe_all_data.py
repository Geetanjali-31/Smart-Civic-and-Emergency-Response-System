import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, ServiceRequest, Notification, ComplaintAuditLog, User, Authority
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🧹 Cleaning all testing data from MySQL database...")

    try:
        # Disable foreign key checks for clean truncate on MySQL
        if db.engine.url.drivername.startswith('mysql'):
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            db.session.commit()

        print(" - Deleting all service requests...")
        ServiceRequest.query.delete()

        print(" - Deleting all notifications...")
        Notification.query.delete()

        print(" - Deleting all audit logs...")
        ComplaintAuditLog.query.delete()

        print(" - Deleting all users & authority accounts...")
        User.query.delete()
        Authority.query.delete()

        db.session.commit()

        # Re-enable foreign key checks
        if db.engine.url.drivername.startswith('mysql'):
            db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            db.session.commit()

        print("✅ SUCCESS: All testing data, complaints, notifications, and user records have been completely removed!")

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error wiping database: {e}")
