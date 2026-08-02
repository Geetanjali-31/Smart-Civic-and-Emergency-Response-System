import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Authority, ServiceRequest, Notification, Department, CategoryDepartmentMap
from datetime import datetime, timedelta

def init_db():
    app = create_app()
    with app.app_context():
        print("Creating SQLite database tables in sevasetu.db...")
        db.create_all()

        # 1. Seed Departments
        dept_data = [
            ("municipal", "Municipal Corporation", 2, 12, 24, 48),
            ("water", "Water Supply & Sewage Board", 2, 12, 24, 48),
            ("electricity", "State Electricity Distribution Board", 2, 12, 24, 48),
            ("fire", "Fire & Emergency Rescue Services", 1, 4, 12, 24),
            ("health", "Public Health & Medical Services", 1, 6, 12, 24),
            ("pwd", "Public Works Department (Roads & Infra)", 4, 24, 48, 72),
        ]
        for code, name, c, h, m, l in dept_data:
            if not Department.query.filter_by(code=code).first():
                d = Department(code=code, name=name, sla_critical_hours=c, sla_high_hours=h, sla_medium_hours=m, sla_low_hours=l)
                db.session.add(d)

        # 2. Seed Pre-Registered Users
        if not User.query.filter_by(email="citizen@sevasetu.gov.in").first():
            u = User(email="citizen@sevasetu.gov.in", username="citizen", phone="9876543210")
            u.set_password("password123")
            db.session.add(u)

        if not User.query.filter_by(email="user@sevasetu.gov.in").first():
            u = User(email="user@sevasetu.gov.in", username="citizen_user", phone="9876543299")
            u.set_password("password123")
            db.session.add(u)

        # 3. Seed Authorities
        authorities_data = [
            ("admin123@gmail.com", "admin", "all", "9876543211", "password123"),
            ("medical@sevasetu.gov.in", "medical_officer", "health", "9876543212", "password123"),
            ("water@sevasetu.gov.in", "water_officer", "water", "9876543213", "password123"),
            ("municipal@sevasetu.gov.in", "municipal_officer", "municipal", "9876543214", "password123"),
            ("electricity@sevasetu.gov.in", "electricity_officer", "electricity", "9876543215", "password123"),
            ("fire@sevasetu.gov.in", "fire_officer", "fire", "9876543216", "password123"),
            ("pwd@sevasetu.gov.in", "pwd_officer", "pwd", "9876543217", "password123"),
            ("police@sevasetu.gov.in", "police_officer", "police", "9876543218", "password123"),
            ("environment@sevasetu.gov.in", "environment_officer", "environment", "9876543219", "password123"),
        ]

        for email, username, dept, phone, password in authorities_data:
            if not Authority.query.filter_by(email=email).first():
                a = Authority(email=email, username=username, department=dept, phone=phone)
                a.set_password(password)
                db.session.add(a)

        # 4. Seed Baseline System Notifications
        if Notification.query.count() == 0:
            n1 = Notification(
                recipient_id=0,
                recipient_role='authority',
                title="⚡ System Online & Department Dispatch Active",
                message="SevaSetu Command Center is active. Complaints will be auto-routed to respective department officers.",
                type="system",
                ticket_id="SYS-2026-001",
                color="emerald",
                icon="ShieldAlert"
            )
            n2 = Notification(
                recipient_id=0,
                recipient_role='authority',
                title="🔔 Auto-Routing Rule Verified",
                message="All incoming civic complaints and emergency requests will be auto-dispatched to department dashboards.",
                type="assignment",
                ticket_id="SYS-2026-002",
                color="blue",
                icon="Bell"
            )
            n3 = Notification(
                recipient_id=0,
                recipient_role='citizen',
                title="👋 Welcome to SevaSetu Citizen Portal",
                message="Submit non-emergency civic complaints or request emergency medical, fire, or police assistance anytime.",
                type="update",
                ticket_id="SYS-2026-003",
                color="amber",
                icon="FileWarning"
            )
            db.session.add_all([n1, n2, n3])

        db.session.commit()
        print("✅ Database successfully initialized and connected!")

if __name__ == '__main__':
    init_db()
