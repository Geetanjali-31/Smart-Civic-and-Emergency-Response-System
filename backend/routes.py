from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, User, Authority, ServiceRequest, Notification, ComplaintAuditLog
from datetime import datetime

routes_bp = Blueprint('routes', __name__)

# ---------------------------------------------------------------------------
# Category → Department resolver  (mirrors src/utils/smartRoutingEngine.js)
# ---------------------------------------------------------------------------
CATEGORY_DEPT_MAP = {
    'garbage': 'municipal', 'sewage': 'municipal', 'litter': 'municipal',
    'sanitation': 'municipal',
    'water': 'water', 'water_leakage': 'water', 'pipe_burst': 'water',
    'drainage': 'water',
    'electricity': 'electricity', 'streetlight': 'electricity',
    'power': 'electricity', 'wire': 'electricity',
    'fire': 'fire', 'fire_rescue': 'fire', 'gas_leak': 'fire',
    'medical': 'health', 'ambulance': 'health', 'injury': 'health',
    'pothole': 'pwd', 'road_damage': 'pwd', 'bridge': 'pwd', 'hazard': 'pwd',
    'police': 'police', 'crime': 'police',
    'other': 'municipal',
}

KEYWORD_DEPT_HINTS = [
    ('municipal',    ['garbage', 'waste', 'dumping', 'sewage', 'trash', 'dustbin', 'litter']),
    ('water',        ['water leakage', 'pipe burst', 'no water', 'contamination', 'pipeline', 'drainage']),
    ('electricity',  ['electric', 'short circuit', 'sparking', 'transformer', 'wire', 'power outage', 'streetlight']),
    ('fire',         ['fire', 'gas leak', 'explosion', 'flame', 'smoke', 'cylinder']),
    ('health',       ['ambulance', 'bleeding', 'accident', 'unconscious', 'heart attack', 'hospital', 'injury']),
    ('pwd',          ['pothole', 'road damage', 'bridge', 'wall collapse', 'pavement', 'asphalt']),
    ('police',       ['theft', 'crime', 'robbery', 'fight', 'violence', 'suspicious']),
]

def resolve_department(category: str, title: str = '', description: str = '') -> str:
    """Return the canonical department key for a complaint."""
    cat = (category or 'other').lower().strip()
    dept = CATEGORY_DEPT_MAP.get(cat, 'municipal')

    # Keyword scan on title + description
    text = f"{title} {description}".lower()
    best_dept, best_count = dept, 0
    for dept_key, keywords in KEYWORD_DEPT_HINTS:
        count = sum(1 for kw in keywords if kw in text)
        if count > best_count:
            best_count = count
            best_dept = dept_key

    return best_dept if best_count > 0 else dept

def get_reporter_id(current_user_id):
    """Get reporter_id from JWT identity, or None if unauthenticated."""
    if current_user_id:
        return int(current_user_id)
    # Return the first real user if available, else None
    user = User.query.first()
    return user.id if user else None

@routes_bp.route('/users', methods=['GET'])
@jwt_required(optional=True)
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@routes_bp.route('/services', methods=['GET'])
@jwt_required(optional=True)
def get_services():
    services = ServiceRequest.query.order_by(ServiceRequest.id.desc()).all()
    return jsonify([service.to_dict() for service in services]), 200

@routes_bp.route('/services/me', methods=['GET'])
@jwt_required(optional=True)
def get_my_services():
    current_user_id = get_jwt_identity()
    user_id = get_reporter_id(current_user_id)
    if user_id is None:
        return jsonify([]), 200
    services = ServiceRequest.query.filter_by(reporter_id=user_id).order_by(ServiceRequest.id.desc()).all()
    return jsonify([service.to_dict() for service in services]), 200

@routes_bp.route('/services/assigned', methods=['GET'])
@jwt_required(optional=True)
def get_assigned_services():
    current_user_id = get_jwt_identity()
    if current_user_id:
        services = ServiceRequest.query.filter_by(assigned_to=int(current_user_id)).order_by(ServiceRequest.id.desc()).all()
    else:
        services = ServiceRequest.query.order_by(ServiceRequest.id.desc()).all()
    return jsonify([service.to_dict() for service in services]), 200

@routes_bp.route('/services', methods=['POST'])
@jwt_required(optional=True)
def create_service():
    current_user_id = get_jwt_identity()
    reporter_id = get_reporter_id(current_user_id)
    data = request.get_json() or {}

    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    location = data.get('location')
    image_url = data.get('image_url')

    lat_raw = data.get('latitude')
    lng_raw = data.get('longitude')
    try:
        latitude = float(lat_raw) if lat_raw is not None and str(lat_raw).strip() != '' else None
    except (ValueError, TypeError):
        latitude = None

    try:
        longitude = float(lng_raw) if lng_raw is not None and str(lng_raw).strip() != '' else None
    except (ValueError, TypeError):
        longitude = None

    if not title or not description or not category:
        return jsonify({"msg": "Missing required fields"}), 400

    if reporter_id is None:
        return jsonify({"msg": "Authentication required to submit a complaint"}), 401

    new_request = ServiceRequest(
        title=title,
        description=description,
        category=category,
        department=data.get('department', 'municipal'),
        priority=data.get('priority', 'Medium'),
        status=data.get('status', 'submitted'),
        location=location,
        latitude=latitude,
        longitude=longitude,
        image_url=image_url,
        reporter_id=reporter_id,
        is_category_mismatch=data.get('is_category_mismatch', False),
        suggested_department=data.get('suggested_department'),
        requires_controller_review=data.get('requires_controller_review', False),
        is_fast_tracked=data.get('is_fast_tracked', False),
        escalation_level=data.get('escalation_level', 'none'),
        upvote_count=data.get('upvote_count', 1)
    )

    try:
        db.session.add(new_request)
        db.session.flush()  # get new_request.id before commit

        # Resolve canonical department from category + text content
        notif_dept = resolve_department(
            category,
            title,
            data.get('description', '')
        )
        # If the ServiceRequest already has an explicit department set, honour it
        if new_request.department and new_request.department != 'municipal':
            notif_dept = new_request.department

        # Generate Notifications
        req_dict = new_request.to_dict()
        ticket_code = req_dict.get('ticket_id', f"CV-2026-{new_request.id:03d}")
        is_emergency = category == 'emergency' or new_request.priority == 'Critical'

        dept_label = notif_dept.replace('_', ' ').upper()

        # 1. Citizen Notification  (dept tag for future use, filtered by recipient_id anyway)
        cit_notif = Notification(
            recipient_id=reporter_id,
            recipient_role='citizen',
            department=notif_dept,
            title=f"🚨 Emergency Dispatched: #{ticket_code}" if is_emergency else f"Complaint Lodged: #{ticket_code}",
            message=f"Your request '{title}' has been logged and dispatched to {dept_label} Department.",
            type="emergency" if is_emergency else "update",
            ticket_id=ticket_code,
            color="red" if is_emergency else "amber",
            icon="ShieldAlert" if is_emergency else "FileWarning"
        )
        db.session.add(cit_notif)

        # 2. Initial Audit Log
        initial_log = ComplaintAuditLog(
            service_request_id=new_request.id,
            action="Ticket Created & Auto-Routed",
            actor_name=f"Citizen #{reporter_id}",
            actor_role="Citizen",
            comments=f"Complaint lodged and auto-dispatched to {dept_label} Department."
        )
        db.session.add(initial_log)

        db.session.commit()
        return jsonify(new_request.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Database error: {str(e)}"}), 500

@routes_bp.route('/services/<int:service_id>', methods=['GET'])
@jwt_required(optional=True)
def get_service(service_id):
    service = ServiceRequest.query.get_or_404(service_id)
    return jsonify(service.to_dict()), 200

@routes_bp.route('/services/<int:service_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_service(service_id):
    service = ServiceRequest.query.get_or_404(service_id)
    data = request.get_json() or {}

    old_status = service.status
    old_assigned_to = service.assigned_to

    new_status = data.get('status')
    if new_status == 'closed':
        has_feedback = bool(service.feedback_rating or data.get('feedback_rating'))
        if not has_feedback:
            return jsonify({"msg": "Complaint cannot be closed until the citizen provides feedback and rating."}), 400

    if 'status' in data: service.status = data['status']
    if 'title' in data: service.title = data['title']
    if 'description' in data: service.description = data['description']
    if 'department' in data: service.department = data['department']
    if 'priority' in data: service.priority = data['priority']
    if 'requires_controller_review' in data: service.requires_controller_review = data['requires_controller_review']
    if 'is_category_mismatch' in data: service.is_category_mismatch = data['is_category_mismatch']
    if 'resolution_proof_url' in data: service.resolution_proof_url = data['resolution_proof_url']
    if 'resolution_notes' in data: service.resolution_notes = data['resolution_notes']
    if 'feedback_rating' in data: service.feedback_rating = data['feedback_rating']
    if 'feedback_comments' in data: service.feedback_comments = data['feedback_comments']
    if 'upvote_count' in data: service.upvote_count = data['upvote_count']
    
    current_user_id = get_jwt_identity()
    claims = get_jwt() if current_user_id else {}
    role = claims.get('role', 'citizen')
    
    if data.get('assigned_to'):
        service.assigned_to = data.get('assigned_to')
    elif service.status == 'accepted' and not service.assigned_to and current_user_id:
        if role == 'authority':
            service.assigned_to = int(current_user_id)
            
    # Audit Log Recording
    if old_status != service.status or data.get('comments') or data.get('resolution_notes'):
        action_text = f"Status: {service.status.upper()}" if old_status != service.status else "Update Logged"
        log_entry = ComplaintAuditLog(
            service_request_id=service.id,
            action=action_text,
            actor_name=f"Officer #{current_user_id}" if current_user_id else "Authority",
            actor_role=role.capitalize(),
            comments=data.get('comments') or data.get('resolution_notes') or f"Status changed from {old_status} to {service.status}"
        )
        db.session.add(log_entry)

    # Dispatch Notifications
    service_dict = service.to_dict()
    ticket_code = service_dict.get('ticket_id', f"CV-2026-{service.id:03d}")
    # Resolve department for this service (used to tag authority update notifications)
    svc_dept = resolve_department(service.category or '', service.title or '', service.description or '')
    if service.department and service.department != 'municipal':
        svc_dept = service.department

    if old_status != service.status and service.status != 'pending':
        status_label = service.status.replace('_', ' ').title()
        msg = f"Your request '{service.title}' ({ticket_code}) is now {status_label}."
        color = 'emerald' if service.status == 'resolved' else ('slate' if service.status == 'closed' else 'blue')
        icon = 'CheckCircle2' if service.status in ('resolved', 'closed') else 'FileWarning'

        # Citizen notification — scoped by recipient_id
        cit_notif = Notification(
            recipient_id=service.reporter_id,
            recipient_role='citizen',
            department=svc_dept,
            title=f"✅ Resolved: #{ticket_code}" if service.status == 'resolved' else f"Update on #{ticket_code}",
            message=msg,
            type="resolved" if service.status == 'resolved' else "update",
            ticket_id=ticket_code,
            color=color,
            icon=icon
        )
        db.session.add(cit_notif)

        # Authority notification for status change — only visible to the same department
        auth_update_notif = Notification(
            recipient_id=0,
            recipient_role='authority',
            department=svc_dept,
            title=f"📌 Ticket {status_label}: #{ticket_code}",
            message=f"Complaint '{service.title}' status changed to {status_label}.",
            type="update",
            ticket_id=ticket_code,
            color=color,
            icon=icon
        )
        db.session.add(auth_update_notif)
        
    db.session.commit()
    return jsonify(service.to_dict()), 200

@routes_bp.route('/notifications', methods=['GET'])
@jwt_required(optional=True)
def get_notifications():
    if Notification.query.count() == 0:
        n1 = Notification(
            recipient_id=0,
            recipient_role='authority',
            department='all',
            title="⚡ System Online & Department Dispatch Active",
            message="SevaSetu Command Center is operational. Department-wise complaint routing is active.",
            type="system",
            ticket_id="SYS-2026-001",
            color="emerald",
            icon="ShieldAlert"
        )
        n2 = Notification(
            recipient_id=0,
            recipient_role='authority',
            department='all',
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
            department='all',
            title="👋 Welcome to SevaSetu Citizen Portal",
            message="Submit non-emergency civic complaints or request emergency medical, fire, or police assistance anytime.",
            type="update",
            ticket_id="SYS-2026-003",
            color="amber",
            icon="FileWarning"
        )
        db.session.add_all([n1, n2, n3])
        db.session.commit()

    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen') if claims else 'citizen'

    all_notifs = Notification.query.order_by(Notification.created_at.desc()).all()

    if not current_user_id:
        return jsonify([n.to_dict() for n in all_notifs]), 200

    filtered = []
    if role == 'authority':
        auth = Authority.query.get(int(current_user_id))
        raw_dept = (auth.department or 'all').strip() if auth else 'all'
        # Normalize to canonical key (handles "Public Works", "roads", "pwd", etc.)
        auth_dept = resolve_department(raw_dept) if raw_dept not in ('all', 'admin', 'superadmin') else 'all'

        for n in all_notifs:
            n_dept_raw = (n.department or 'all').strip()
            n_dept = resolve_department(n_dept_raw) if n_dept_raw not in ('all', 'admin') else 'all'
            if auth_dept == 'all' or n_dept == 'all' or n_dept == auth_dept:
                filtered.append(n)
    else:
        uid = int(current_user_id)
        for n in all_notifs:
            # Citizens only see: their own specific notification, OR citizen-role broadcasts
            if n.recipient_role == 'citizen' and (n.recipient_id == uid or n.recipient_id == 0):
                filtered.append(n)

    return jsonify([n.to_dict() for n in filtered]), 200

@routes_bp.route('/notifications/read', methods=['PUT'])
@jwt_required(optional=True)
def mark_notifications_read():
    notifications = Notification.query.filter_by(is_unread=True).all()
    for n in notifications:
        n.is_unread = False
    
    db.session.commit()
    return jsonify({"msg": "All notifications marked as read"}), 200

@routes_bp.route('/notifications/clear_all', methods=['GET', 'DELETE', 'POST'])
def clear_all_notifications():
    try:
        Notification.query.delete()
        db.session.commit()
        return jsonify({"msg": "All notifications cleared"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@routes_bp.route('/services/<int:service_id>', methods=['DELETE'])
@jwt_required(optional=True)
def delete_service(service_id):
    service = ServiceRequest.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"msg": "Service request deleted"}), 200

@routes_bp.route('/services/clear_all', methods=['GET', 'POST', 'DELETE'])
def clear_all_services():
    try:
        ServiceRequest.query.delete()
        Notification.query.delete()
        db.session.commit()
        return jsonify({"msg": "All services and notifications cleared successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
