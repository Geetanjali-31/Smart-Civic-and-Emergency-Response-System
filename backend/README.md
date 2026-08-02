# SevaSetu Python Backend

This is the custom Python (Flask) backend for the SevaSetu – Civic & Emergency Response System.

## Features
- **RESTful API**: Built with Flask.
- **Authentication**: JWT-based (Flask-JWT-Extended).
- **Database**: SQLAlchemy ORM (supports SQLite, PostgreSQL, MySQL).
- **Security**: Password hashing with Werkzeug.
- **CORS**: Enabled for frontend communication.

## Setup & Local Development

### 1. Create a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

### 4. Run the Server
```bash
python app.py
```
The server will run at `http://localhost:5000/`.

## API Endpoints

### Authentication
- `POST /api/signup`: Register a new user.
- `POST /api/login`: Authenticate and receive a JWT.
- `GET /api/profile`: Get the current user's profile (requires JWT).

### Services
- `GET /api/services`: List all service requests.
- `POST /api/services`: Create a new service request.
- `GET /api/services/<id>`: Get details of a specific request.
- `PUT /api/services/<id>`: Update a request (e.g., status).
- `DELETE /api/services/<id>`: Delete a request.

### Users
- `GET /api/users`: List all registered users (for admin/authority).
