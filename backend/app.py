import os
from flask import Flask, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from flask_jwt_extended import JWTManager
from models import db
from auth import auth_bp
from routes import routes_bp
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///sevasetu.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-key')

    # Configure SSL options if connecting to Aiven or cloud MySQL
    if 'aivencloud.com' in app.config['SQLALCHEMY_DATABASE_URI']:
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'connect_args': {
                'ssl': {'ssl_mode': 'REQUIRED'}
            }
        }

    db.init_app(app)
    jwt = JWTManager(app)

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(routes_bp, url_prefix='/api')

    @app.route('/api/ping')
    def ping():
        return jsonify({"status": "ok", "message": "SevaSetu backend is running"}), 200

    @app.route('/api/db-status')
    def db_status():
        try:
            # pyrefly: ignore [missing-import]
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            from models import User, Authority, ServiceRequest
            return jsonify({
                "status": "connected",
                "db_type": "SQLite",
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
   # pyrefly: ignore [missing-import]
    from sqlalchemy import text
    try:
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
    except Exception as e:
        print(f"Schema update info: {str(e)}")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        update_db_schema()
    app.run(debug=True, host='127.0.0.1', port=5000)
