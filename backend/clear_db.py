import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, Department, Notification
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("🔥 Completely wiping MySQL database...")

    # Disable foreign key checks for clean drop on MySQL
    if db.engine.url.drivername.startswith('mysql'):
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        db.session.commit()
    
    print(" - Dropping all tables (Users, Logins, Complaints, Notifications, Audit Logs)...")
    db.drop_all()
    
    # Re-enable foreign key checks
    if db.engine.url.drivername.startswith('mysql'):
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()

    print(" - Recreating empty database tables...")
    db.create_all()

    print(" - Seeding default department definitions...")
    dept_data = [
        ("municipal", "Municipal Corporation", 2, 12, 24, 48),
        ("water", "Water Supply & Sewage Board", 2, 12, 24, 48),
        ("electricity", "State Electricity Distribution", 2, 12, 24, 48),
        ("fire", "Fire & Emergency Rescue", 1, 4, 12, 24),
        ("health", "Public Health & Medical Services", 1, 6, 12, 24),
        ("pwd", "Public Works Department", 4, 24, 48, 72),
        ("police", "Police & Law Enforcement", 1, 4, 12, 24),
        ("environment", "Environment & Sanitation", 4, 24, 48, 72),
    ]
    for code, name, c, h, m, l in dept_data:
        d = Department(code=code, name=name, sla_critical_hours=c, sla_high_hours=h, sla_medium_hours=m, sla_low_hours=l)
        db.session.add(d)
    
    print(" - Seeding baseline system notifications...")
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

    print("\n" + "="*60)
    print("✅ SUCCESS: Database completely cleared & baseline alerts seeded!")
    print("   - Users        : 0")
    print("   - Logins       : 0")
    print("   - Complaints   : 0")
    print("   - Notifications: 3 Ready")
    print("   - Departments  : 8 Ready")
    print("="*60)
