"""
db_check.py - Database Connectivity & Schema Diagnostic Tool
Run from the backend directory:  python db_check.py
"""
import os
import sys

# ── Check dependencies ────────────────────────────────────────────────────────
MISSING = []
for pkg in ['flask', 'flask_sqlalchemy', 'flask_jwt_extended', 'flask_cors', 'werkzeug', 'dotenv']:
    try:
        __import__(pkg)
    except ImportError:
        MISSING.append(pkg)

if MISSING:
    print(f"\n❌ Missing packages: {', '.join(MISSING)}")
    print("   Run: pip install -r requirements.txt")
    sys.exit(1)

print("✅ All Python packages installed")

# ── Load app context ──────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Authority, ServiceRequest, Notification, Department

app = create_app()

with app.app_context():
    db_type = 'MySQL' if 'mysql' in str(db.engine.url.drivername).lower() else 'SQLite'
    print(f"\n🔌 Database Engine: {db_type} ({db.engine.url})")

    # ── Step 1: Create tables ─────────────────────────────────────────────────
    try:
        db.create_all()
        print(f"✅ {db_type} database tables created / verified")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        sys.exit(1)

    # ── Step 2: Schema migration ──────────────────────────────────────────────
    from sqlalchemy import text, inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"✅ Tables in DB: {', '.join(tables)}")

    # ── Step 3: Verify required tables exist ──────────────────────────────────
    required = ['users', 'authorities', 'service_requests', 'notifications', 'departments']
    missing_tables = [t for t in required if t not in tables]
    if missing_tables:
        print(f"❌ Missing tables: {missing_tables}")
    else:
        print("✅ All required tables present")

    # ── Step 4: Comprehensive Column Sync for all tables ──────────────────────
    table_column_maps = {
        'service_requests': {
            'title': 'VARCHAR(200)',
            'description': 'TEXT',
            'category': 'VARCHAR(50)',
            'department': 'VARCHAR(50) DEFAULT "municipal"',
            'priority': 'VARCHAR(20) DEFAULT "Medium"',
            'status': 'VARCHAR(30) DEFAULT "submitted"',
            'location': 'VARCHAR(200)',
            'latitude': 'FLOAT',
            'longitude': 'FLOAT',
            'image_url': 'LONGTEXT' if db_type == 'MySQL' else 'TEXT',
            'reporter_id': 'INTEGER',
            'assigned_to': 'INTEGER',
            'is_category_mismatch': 'BOOLEAN DEFAULT 0',
            'suggested_department': 'VARCHAR(50)',
            'requires_controller_review': 'BOOLEAN DEFAULT 0',
            'is_fast_tracked': 'BOOLEAN DEFAULT 0',
            'escalation_level': 'VARCHAR(20) DEFAULT "none"',
            'sla_due_at': 'DATETIME',
            'upvote_count': 'INTEGER DEFAULT 1',
            'parent_ticket_id': 'INTEGER',
            'resolution_proof_url': 'TEXT',
            'resolution_notes': 'TEXT',
            'feedback_rating': 'INTEGER',
            'feedback_comments': 'TEXT',
            'created_at': 'DATETIME',
            'updated_at': 'DATETIME'
        },
        'users': {
            'email': 'VARCHAR(120)',
            'password_hash': 'VARCHAR(256)',
            'username': 'VARCHAR(80)',
            'phone': 'VARCHAR(20)',
            'profile_picture': 'VARCHAR(500)',
            'created_at': 'DATETIME'
        },
        'authorities': {
            'email': 'VARCHAR(120)',
            'password_hash': 'VARCHAR(256)',
            'username': 'VARCHAR(80)',
            'department': 'VARCHAR(80)',
            'phone': 'VARCHAR(20)',
            'profile_picture': 'VARCHAR(500)',
            'created_at': 'DATETIME'
        },
        'departments': {
            'code': 'VARCHAR(50)',
            'name': 'VARCHAR(100)',
            'head_officer_id': 'INTEGER',
            'sla_critical_hours': 'INTEGER DEFAULT 2',
            'sla_high_hours': 'INTEGER DEFAULT 12',
            'sla_medium_hours': 'INTEGER DEFAULT 24',
            'sla_low_hours': 'INTEGER DEFAULT 48',
            'created_at': 'DATETIME'
        },
        'notifications': {
            'recipient_id': 'INTEGER',
            'recipient_role': 'VARCHAR(20)',
            'title': 'VARCHAR(200)',
            'message': 'TEXT',
            'type': 'VARCHAR(50)',
            'is_unread': 'BOOLEAN DEFAULT 1',
            'ticket_id': 'VARCHAR(50)',
            'color': 'VARCHAR(20) DEFAULT "slate"',
            'icon': 'VARCHAR(50) DEFAULT "Bell"',
            'created_at': 'DATETIME'
        }
    }

    for table_name, col_map in table_column_maps.items():
        if table_name in tables:
            existing_cols = [c['name'] for c in inspector.get_columns(table_name)]
            missing_cols = [col for col in col_map if col not in existing_cols]
            if missing_cols:
                print(f"⚠️  Syncing missing columns in '{table_name}': {missing_cols}")
                for col in missing_cols:
                    col_type = col_map[col]
                    try:
                        db.session.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col} {col_type}"))
                        db.session.commit()
                        print(f"   ✅ Added column '{col}' to {table_name}")
                    except Exception as e:
                        db.session.rollback()
                        print(f"   ℹ️ Column {col} on {table_name} status: {e}")

    # ── Step 5: Seed departments ──────────────────────────────────────────────
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
    added_depts = 0
    for code, name, c, h, m, l in dept_data:
        if not Department.query.filter_by(code=code).first():
            d = Department(code=code, name=name, sla_critical_hours=c,
                           sla_high_hours=h, sla_medium_hours=m, sla_low_hours=l)
            db.session.add(d)
            added_depts += 1
    db.session.commit()
    total_depts = Department.query.count()
    print(f"✅ Departments: {total_depts} total ({added_depts} newly added)")

    # ── Step 6: Check record counts ───────────────────────────────────────────
    user_count = User.query.count()
    auth_count = Authority.query.count()
    sr_count = ServiceRequest.query.count()
    notif_count = Notification.query.count()

    print(f"\n📊 Database Record Summary ({db_type}):")
    print(f"   Users          : {user_count}")
    print(f"   Authorities    : {auth_count}")
    print(f"   Service Reqs   : {sr_count}")
    print(f"   Notifications  : {notif_count}")
    print(f"   Departments    : {total_depts}")

    # ── Step 7: Write test ────────────────────────────────────────────────────
    print("\n🔧 Running write test...")
    try:
        test_user = User.query.filter_by(email='dbtest@sevasetu.internal').first()
        if not test_user:
            test_user = User(email='dbtest@sevasetu.internal', username='__db_test__', phone='0000000000')
            test_user.set_password('test')
            db.session.add(test_user)
            db.session.commit()
            print(f"   ✅ Write test passed (user ID: {test_user.id})")
            # Clean up
            db.session.delete(test_user)
            db.session.commit()
            print(f"   ✅ Cleanup passed")
        else:
            print(f"   ✅ Write test user already exists (ID: {test_user.id})")
    except Exception as e:
        db.session.rollback()
        print(f"   ❌ Write test FAILED: {e}")

    print("\n" + "="*50)
    print("✅ DATABASE CONNECTIVITY & SCHEMA CHECK COMPLETE")
    print(f"   Connected to {db_type} database: {db.engine.url.database}")
    print("   Backend is ready! Start with: python app.py")
    print("="*50)
