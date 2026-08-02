from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    profile_picture = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat()
        }

class Authority(db.Model):
    __tablename__ = 'authorities'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    department = db.Column(db.String(80), nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    profile_picture = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'department': self.department,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat()
        }

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False) # e.g. 'municipal', 'water', 'electricity', 'fire', 'health', 'pwd'
    name = db.Column(db.String(100), nullable=False)
    head_officer_id = db.Column(db.Integer, db.ForeignKey('authorities.id'), nullable=True)
    sla_critical_hours = db.Column(db.Integer, default=2)
    sla_high_hours = db.Column(db.Integer, default=12)
    sla_medium_hours = db.Column(db.Integer, default=24)
    sla_low_hours = db.Column(db.Integer, default=48)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'head_officer_id': self.head_officer_id,
            'sla_critical_hours': self.sla_critical_hours,
            'sla_high_hours': self.sla_high_hours,
            'sla_medium_hours': self.sla_medium_hours,
            'sla_low_hours': self.sla_low_hours,
            'created_at': self.created_at.isoformat()
        }

class CategoryDepartmentMap(db.Model):
    __tablename__ = 'category_department_maps'
    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(50), unique=True, nullable=False)
    department_code = db.Column(db.String(50), nullable=False)
    description_keywords = db.Column(db.Text, nullable=True) # Comma separated keywords

    def to_dict(self):
        return {
            'id': self.id,
            'category_name': self.category_name,
            'department_code': self.department_code,
            'description_keywords': self.description_keywords
        }

class ServiceRequest(db.Model):
    __tablename__ = 'service_requests'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False) # 'emergency' or 'civic'
    department = db.Column(db.String(50), nullable=True, default='municipal')
    priority = db.Column(db.String(20), default='Medium') # 'Critical', 'High', 'Medium', 'Low'
    status = db.Column(db.String(30), default='submitted') # 'submitted', 'verified', 'assigned', 'accepted', 'in_progress', 'resolved', 'feedback_received', 'closed'
    location = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.Text, nullable=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('authorities.id'), nullable=True)
    
    # Smart Routing & Controller Fields
    is_category_mismatch = db.Column(db.Boolean, default=False)
    suggested_department = db.Column(db.String(50), nullable=True)
    requires_controller_review = db.Column(db.Boolean, default=False)
    is_fast_tracked = db.Column(db.Boolean, default=False)
    
    # SLA & Escalation
    escalation_level = db.Column(db.String(20), default='none') # 'none', 'dept_head', 'controller', 'admin'
    sla_due_at = db.Column(db.DateTime, nullable=True)
    
    # Upvotes & Duplicates
    upvote_count = db.Column(db.Integer, default=1)
    parent_ticket_id = db.Column(db.Integer, nullable=True)
    
    # Resolution Proof & Feedback
    resolution_proof_url = db.Column(db.Text, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    feedback_rating = db.Column(db.Integer, nullable=True)
    feedback_comments = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reporter = db.relationship('User', foreign_keys=[reporter_id], backref=db.backref('reported_requests', lazy=True))
    assignee = db.relationship('Authority', foreign_keys=[assigned_to], backref=db.backref('assigned_tasks', lazy=True))
    audit_logs = db.relationship('ComplaintAuditLog', backref='service_request', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        cat = (self.category or '').lower()
        t = (self.title or '').lower()
        if 'garb' in cat or 'garb' in t: code = 'GB'
        elif 'water' in cat or 'water' in t: code = 'WL'
        elif 'electr' in cat or 'light' in cat or 'electr' in t or 'light' in t: code = 'EL'
        elif 'fire' in cat or 'fire' in t: code = 'FD'
        elif 'sewag' in cat or 'drain' in cat or 'sewag' in t or 'drain' in t: code = 'SW'
        elif 'pothol' in cat or 'road' in cat or 'pothol' in t or 'road' in t: code = 'RD'
        elif 'medic' in cat or 'health' in cat or 'medic' in t or 'health' in t: code = 'MD'
        elif 'polic' in cat or 'crime' in cat or 'polic' in t or 'crime' in t: code = 'PD'
        elif 'hazar' in cat or 'hazar' in t: code = 'HZ'
        else: code = 'CV'
        
        year = self.created_at.year if self.created_at else datetime.utcnow().year
        serial = f"{((self.id - 1) % 999) + 1:03d}" if self.id else '001'
        ticket_id = f"{code}-{year}-{serial}"

        logs = [log.to_dict() for log in self.audit_logs] if self.audit_logs else [
            {
                'id': f"initial_{self.id}",
                'service_request_id': self.id,
                'action': 'Ticket Submitted',
                'actor_name': f"Citizen #{self.reporter_id or 1}",
                'actor_role': 'Citizen',
                'comments': f"Complaint logged and assigned to {self.department.upper() if self.department else 'MUNICIPAL'} Department.",
                'timestamp': self.created_at.isoformat() if self.created_at else datetime.utcnow().isoformat()
            }
        ]

        return {
            'id': self.id,
            'ticket_id': ticket_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'department': self.department or 'municipal',
            'priority': self.priority or 'Medium',
            'status': self.status or 'submitted',
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'image_url': self.image_url,
            'reporter_id': self.reporter_id,
            'assigned_to': self.assigned_to,
            'is_category_mismatch': self.is_category_mismatch,
            'suggested_department': self.suggested_department,
            'requires_controller_review': self.requires_controller_review,
            'is_fast_tracked': self.is_fast_tracked,
            'escalation_level': self.escalation_level or 'none',
            'sla_due_at': self.sla_due_at.isoformat() if self.sla_due_at else None,
            'upvote_count': self.upvote_count or 1,
            'parent_ticket_id': self.parent_ticket_id,
            'resolution_proof_url': self.resolution_proof_url,
            'resolution_notes': self.resolution_notes,
            'feedback_rating': self.feedback_rating,
            'feedback_comments': self.feedback_comments,
            'audit_logs': logs,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ComplaintAuditLog(db.Model):
    __tablename__ = 'complaint_audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey('service_requests.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    actor_name = db.Column(db.String(100), nullable=False)
    actor_role = db.Column(db.String(50), nullable=False)
    comments = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'service_request_id': self.service_request_id,
            'action': self.action,
            'actor_name': self.actor_name,
            'actor_role': self.actor_role,
            'comments': self.comments,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, nullable=False) 
    recipient_role = db.Column(db.String(20), nullable=False) # 'citizen' or 'authority'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False) # 'emergency', 'update', 'resolved', 'assignment', 'system'
    is_unread = db.Column(db.Boolean, default=True)
    ticket_id = db.Column(db.String(50), nullable=True) # e.g. CIV-189
    department = db.Column(db.String(50), nullable=True, default='all')
    color = db.Column(db.String(20), default='slate')
    icon = db.Column(db.String(50), default='Bell')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'recipient_id': self.recipient_id,
            'recipient_role': self.recipient_role,
            'department': self.department or 'all',
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_unread': self.is_unread,
            'ticket_id': self.ticket_id,
            'color': self.color,
            'icon': self.icon,
            'created_at': self.created_at.isoformat()
        }
