# 🏛️ Seva Setu (सेवा सेतु)
### Smart Civic & Rapid Emergency Response System

[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Python Flask](https://img.shields.io/badge/Backend-Python_Flask-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Database](https://img.shields.io/badge/Database-SQLite_%2F_MySQL-4479A1?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📌 Problem Statement

In modern urban environments, public grievance management systems often suffer from key structural inefficiencies:
1. **Misrouted Complaints**: Manual routing leads to delays when civic complaints (e.g. water leakage, streetlight outages, pothole hazards) are submitted under incorrect departments.
2. **Emergency Response Latency**: Critical incidents (fire, medical emergencies, police alerts) frequently get delayed in generic ticketing queues without fast-tracking.
3. **Lack of Location Precision**: Text-only location descriptions lead to difficulty for field personnel in locating exact incident sites.
4. **Duplicate Filing Overload**: Multiple citizens reporting the same localized issue overload department queues.
5. **Opaque SLA Tracking**: Citizens lack real-time visibility into Service Level Agreement (SLA) deadlines and escalation progress.

---

## 🎯 Project Objective

**Seva Setu** ("Bridge of Service") is a modern, full-stack civic technology portal designed to streamline municipal governance and rapid emergency response. The platform bridges the gap between citizens and municipal authorities through intelligent auto-routing, controller verification, geospatial mapping, priority-based SLA calculation, and real-time alert dispatch.

---

## 🌟 Key Features

### 🏢 1. Dual Incident Channels
* **Civic Grievances**: Non-emergency public reporting for Sanitation/Garbage, Water Supply, Electricity & Streetlights, Road/PWD Hazards, and Sewage.
* **Rapid Emergency Dispatch**: Immediate dispatch channel for Medical, Fire/Rescue, Police Assistance, and Severe Hazards, featuring direct 112 / 108 / 100 / 101 emergency speed-dial integrations.

### 🧠 2. Smart Routing & Keyword Verification Engine
* **Automated Auto-Routing**: Maps complaint categories directly to canonical department queues (`municipal`, `water`, `electricity`, `fire`, `health`, `pwd`, `police`).
* **Category Mismatch Detection**: Scans complaint titles and descriptions using keyword fingerprints to detect mismatches between the citizen-selected category and actual incident details.
* **Fast-Track Emergency Bypass**: Critical emergency tickets bypass standard review to immediately notify departmental field dispatchers and command centers.

### 🎛️ 3. Controller Verification Command Center
* **Gated Queue Review**: Mismatched or ambiguous complaints are held in a dedicated Controller Review Queue before dispatching to departments.
* **Cross-Department Re-routing**: Controllers can review keyword fingerprints and re-assign complaints to the correct department with an audit trail.

### 📍 4. Geospatial Location & Mapping
* **High-Precision Reverse Geocoding**: Integrated OpenStreetMap Nominatim reverse-geocoding via Leaflet for precise address capture.
* **Interactive Authority Map**: Map view with custom markers distinguishing critical emergency calls (red) from civic reports (amber).

### 🔄 5. Duplicate Complaint Detection
* **Haversine Proximity Check**: Uses the Haversine distance formula to calculate proximity for new complaints against unresolved tickets within a 500-meter radius.
* **Queue De-duplication**: Flags potential duplicate tickets to prevent administrative overload.

### ⏱️ 6. Priority SLA & Multi-Tier Escalation Engine
* **Dynamic SLA Computation**: Automatically assigns resolution target windows based on priority:
  * **Critical**: 2 Hours
  * **High**: 12 Hours
  * **Medium**: 24 Hours
  * **Low**: 48 Hours
* **Escalation Path**: Overdue tickets trigger multi-tier escalation flags (`Department Head` ➔ `Controller` ➔ `Admin`).

### 🔔 7. Notification & Status System
* **Role-Targeted Alerts**: Status-based notifications and alerts dispatched to citizens and authorities upon ticket updates, department assignments, or controller rerouting.

---

## 🛠️ Technologies & Frameworks

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19** | Modern component-based web framework |
| **Build System** | **Vite** | Fast Next-Gen frontend tooling |
| **Routing** | **React Router v7** | Single Page Application (SPA) client-side routing |
| **Styling** | **Tailwind CSS v4** | Utility-first CSS engine |
| **Icons** | **Lucide React** | Modern SVG icons |
| **Maps & GIS** | **Leaflet & React Leaflet** | Interactive mapping and GPS marker rendering |
| **Backend API** | **Python Flask** | Lightweight RESTful Web Framework |
| **Database ORM** | **Flask-SQLAlchemy** | SQL Object-Relational Mapper |
| **Authentication** | **Flask-JWT-Extended** | Secure JSON Web Token authentication |
| **Database** | **MySQL** | SQL persistent data storage |

---

## 🏗️ System Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │              CITIZEN / USER              │
                      └────────────────────┬─────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             [ Civic Report Channel ]             [ Emergency Dispatch ]
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │ (REST API / JWT)
                                           ▼
                      ┌──────────────────────────────────────────┐
                      │              FLASK BACKEND               │
                      ├──────────────────────────────────────────┤
                      │ • Auth Controller (auth.py)              │
                      │ • Service & Incident Routes (routes.py)  │
                      │ • Smart Routing & Verification Logic     │
                      │ • SLA & Audit Engines                    │
                      └────────────────────┬─────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
           ┌────────────────────────┐             ┌────────────────────────┐
           │   CONTROLLER QUEUE     │             │  DEPARTMENT DASHBOARDS │
           │ (Category Mismatches)  │             │ (Municipal, Water, Fire│
           └───────────┬────────────┘             │  Health, Police, PWD)  │
                       │                          └────────────────────────┘
                       ▼
           [ Approve & Re-Route ] ────────────────────────────▲
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ SQL DATABASE    │
                                  │ (SQLite/MySQL)  │
                                  └─────────────────┘
```

---

## 📁 Folder Structure Explanation

```
Sevasetu/
├── backend/
│   ├── app.py                      # Flask app entry point, CORS configuration, DB initialization
│   ├── auth.py                     # Authentication endpoints (User & Authority signup/login/profile)
│   ├── models.py                   # SQLAlchemy Database Schema models (User, Authority, ServiceRequest, etc.)
│   ├── routes.py                   # Core API endpoints (Complaints, Controller Queue, Notifications, Rerouting)
│   ├── init_database.py            # Database initialization and default department seeder
│   ├── db_check.py                 # DB connectivity & schema diagnostic utility
│   ├── clear_db.py                 # Database reset tool
│   ├── wipe_all_data.py            # Data wipe utility script
│   ├── start_backend.bat           # Standalone Windows batch startup script for Flask
│   └── requirements.txt            # Python dependencies manifest
│
├── src/
│   ├── assets/                     # Brand assets and images
│   ├── components/                 # Reusable React components (LocationPickerModal, ProtectedRoute, ErrorBoundary)
│   ├── context/                    # AuthContext (JWT state, login/logout context providers)
│   ├── layouts/                    # MainLayout & DashboardLayout (Sidebars, Navigation Bars)
│   ├── pages/                      # Application Page Components
│   │   ├── Landing.jsx             # Public home landing page
│   │   ├── Login.jsx / Signup.jsx  # Authentication forms
│   │   ├── CitizenDashboard.jsx    # Citizen portal dashboard
│   │   ├── ReportIssue.jsx         # Civic complaint lodging page
│   │   ├── EmergencyReport.jsx     # Rapid emergency dispatch form
│   │   ├── IssueTracking.jsx       # Complaint list & search status tracking
│   │   ├── IssueDetails.jsx        # Detailed ticket view, status updates & audit trail
│   │   ├── ControllerDashboard.jsx # Controller verification & rerouting command center
│   │   ├── DepartmentDashboard.jsx # Department-specific management dashboard
│   │   ├── AuthorityDashboard.jsx  # General authority workload portal
│   │   ├── LiveRequests.jsx        # Real-time incoming ticket feed
│   │   ├── AuthorityMap.jsx        # GIS Leaflet incident map
│   │   ├── Notifications.jsx       # System alerts feed
│   │   └── Profile.jsx             # User profile & credentials management
│   ├── services/
│   │   └── api.js                  # Centralized REST API client & localStorage offline fallback engine
│   └── utils/
│       ├── smartRoutingEngine.js   # Category-to-Department mapping & keyword mismatch algorithm
│       ├── departmentMatcher.js    # Department normalization & filter utilities
│       ├── duplicateDetection.js   # Haversine distance duplicate complaint detection algorithm
│       ├── slaEngine.js            # Priority SLA calculator & escalation status evaluator
│       ├── complaintIdGenerator.js # Formatted ticket ID generator (e.g. GB-2026-001)
│       ├── auditLogger.js          # Audit trail logger helper
│       └── dateFormatter.js       # DD/MM/YYYY date formatting utilities
│
├── index.html                      # Single Page Application HTML shell
├── package.json                    # Node.js dependencies & npm scripts
├── run_all.bat                     # Double-click launcher script (runs Flask Backend & Vite Frontend)
└── vite.config.js                  # Vite bundler configuration
```

---

## 👥 User Roles & Functionalities

| User Role | Access Scope | Key Functionalities |
| :--- | :--- | :--- |
| **Citizen** | `/citizen/*` | • Submit civic reports & emergency calls with GPS location.<br>• View duplicate detection warnings.<br>• Track status, timeline, and SLA metrics of reported grievances.<br>• Receive real-time status updates and notifications. |
| **Department Authority** | `/authority/*` | • Manage department-specific workload.<br>• Accept, update progress, or resolve tickets.<br>• Upload resolution evidence photos.<br>• View live incident feed and spatial map of assigned tickets. |
| **Controller** | `/controller` | • Review complaints flagged for category mismatches.<br>• Override categories and re-route tickets to appropriate departments.<br>• Monitor parallel emergency dispatch alerts. |

---

## ⚙️ Installation & Setup Instructions

### Prerequisites
Make sure you have the following installed on your machine:
* **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
* **Python**: `v3.9.0` or higher ([Download Python](https://www.python.org/))

---

### Option A: One-Click Startup (Windows)

Simply double-click the **`run_all.bat`** file in the root directory. It will automatically start both the Flask backend server and Vite development server in parallel.

---

### Option B: Manual Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SevaSetu.git
cd SevaSetu
```

#### 2. Backend Setup (Flask)
```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# (Optional) Seed default department accounts
python init_database.py

# Run the Flask development server
python app.py
```
*The backend API server will run at `http://127.0.0.1:5000`.*

#### 3. Frontend Setup (React + Vite)
Open a new terminal window in the root directory:

```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
*The web portal will open at `http://localhost:5173`.*

---

## 🔐 Environment Variables & Configuration

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory if connecting to an external database or custom secret:

```env
DATABASE_URL="sqlite:///sevasetu.db"
JWT_SECRET_KEY="super-secret-jwt-key"
```
*(Note: If `DATABASE_URL` is omitted, Flask automatically initializes a local SQLite database in `backend/instance/sevasetu.db`.)*

---

## 🖼️ Screenshots Placeholder

> *Add application UI screenshots below for project demonstration.*

| Citizen Dashboard | Emergency Dispatch |
| :---: | :---: |
| ![Citizen Dashboard Placeholder](https://via.placeholder.com/600x350?text=Citizen+Dashboard+UI) | ![Emergency Dispatch Placeholder](https://via.placeholder.com/600x350?text=Rapid+Emergency+Dispatch) |

| Controller Command Center | Department Map View |
| :---: | :---: |
| ![Controller Center Placeholder](https://via.placeholder.com/600x350?text=Controller+Verification+Queue) | ![Department Map Placeholder](https://via.placeholder.com/600x350?text=Interactive+Leaflet+Map) |

---

## 🚀 Future Enhancements

- 📱 **Native Mobile Application**: Build React Native mobile apps for field officers with offline GPS tracking.
- 🤖 **AI-Powered Image Recognition**: Automated validation of pothole or garbage photo uploads using computer vision.
- 📲 **SMS & WhatsApp Alerts**: Twilio / WhatsApp Business API integration for offline SMS notification updates.
- 📊 **Analytics & Heatmaps**: Advanced analytical dashboards plotting municipal incident heatmaps over time.

---

## 🤝 Contribution Guidelines

Contributions are welcome! Follow these steps:
1. **Fork** the repository.
2. Create a feature branch: `git checkout -b feature/NewFeature`
3. Commit your changes: `git commit -m 'Add NewFeature'`
4. Push to the branch: `git push origin feature/NewFeature`
5. Open a **Pull Request**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p center="text-center">
  <b>Built for Civic Progress & Urban Governance</b>
</p>
