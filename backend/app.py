import sys
import os

# Add backend/ directory to path so that `from models import db`,
# `from auth import auth_bp`, and `from routes import routes_bp` all resolve.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import os as _os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db
from auth import auth_bp
from routes import routes_bp
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def create_app():
    app = Flask(__name__)
    CORS(app)

    # On Vercel use /tmp (writable); locally fall back to a sqlite file in backend/
    default_db = 'sqlite:////tmp/sevasetu.db' if _os.environ.get('VERCEL') else \
                 f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'backend', 'sevasetu.db')}"

    app.config['SQLALCHEMY_DATABASE_URI'] = _os.environ.get('DATABASE_URL', default_db)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = _os.environ.get('JWT_SECRET_KEY', 'super-secret-key')

    # Configure SSL options if connecting to Aiven or cloud MySQL
    if 'aivencloud.com' in app.config['SQLALCHEMY_DATABASE_URI']:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'connect_args': {
                'ssl': {'ssl_mode': 'REQUIRED'}
            }
        }

    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(routes_bp, url_prefix='/api')

    @app.route('/api/ping')
    def ping():
        return jsonify({"status": "ok", "message": "SevaSetu backend is running"}), 200

    @app.route('/api/db-status')
    def db_status():
        try:
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            from models import User, Authority, ServiceRequest
            return jsonify({
                "status": "connected",
                "db_uri": app.config['SQLALCHEMY_DATABASE_URI'],
                "users": User.query.count(),
                "authorities": Authority.query.count(),
                "complaints": ServiceRequest.query.count()
            }), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app


def update_db_schema():
    from sqlalchemy import text
    columns_to_add = [
        ("service_requests", "latitude", "FLOAT"),
        ("service_requests", "longitude", "FLOAT"),
        ("service_requests", "image_url", "TEXT"),
        ("service_requests", "assigned_to", "INTEGER"),
        ("service_requests", "updated_at", "DATETIME"),
        ("users", "profile_picture", "VARCHAR(500)"),
        ("authorities", "profile_picture", "VARCHAR(500)"),
        ("notifications", "department", "VARCHAR(50)")
    ]
    for table, col, col_type in columns_to_add:
        try:
            db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
            db.session.commit()
        except Exception:
            db.session.rollback()


# Vercel calls the module-level `app` variable as the WSGI handler.
app = create_app()

with app.app_context():
    try:
        db.create_all()
        update_db_schema()
    except Exception as e:
        print(f"Database init warning: {e}")

if __name__ == "__main__":
    port = int(_os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
