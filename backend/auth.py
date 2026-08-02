import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
from models import db, User, Authority, ServiceRequest
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/user/signup', methods=['POST'])
def user_signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    phone = data.get('phone')

    if not email or not password or not phone or not username:
        return jsonify({"msg": "Email, phone, username, and password required"}), 400

    if User.query.filter_by(email=email).first() or \
       User.query.filter_by(phone=phone).first() or \
       User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists with that email, phone, or username"}), 400

    new_user = User(email=email, username=username, phone=phone)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route('/user/login', methods=['POST'])
def user_login():
    data = request.get_json()
    username_or_email = data.get('username')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({"msg": "Username/Email and password required"}), 400

    # Look up by email or username
    user = User.query.filter((User.email == username_or_email) | (User.username == username_or_email)).first()

    if user and user.check_password(password):
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims={"role": "citizen"},
            expires_delta=timedelta(days=1)
        )
        user_dict = user.to_dict()
        user_dict['role'] = 'citizen'
        return jsonify(access_token=access_token, user=user_dict), 200

    return jsonify({"msg": "Invalid email/username or password"}), 401

@auth_bp.route('/authority/signup', methods=['POST'])
def authority_signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    department = data.get('department')
    phone = data.get('phone')

    if not email or not password or not phone or not username or not department:
        return jsonify({"msg": "Email, phone, username, department, and password required"}), 400

    if Authority.query.filter_by(email=email).first() or \
       Authority.query.filter_by(phone=phone).first() or \
       Authority.query.filter_by(username=username).first():
        return jsonify({"msg": "Authority already exists with that email, phone, or username"}), 400

    new_auth = Authority(email=email, username=username, department=department, phone=phone)
    new_auth.set_password(password)

    db.session.add(new_auth)
    db.session.commit()

    return jsonify({"msg": "Authority created successfully"}), 201

@auth_bp.route('/authority/login', methods=['POST'])
def authority_login():
    data = request.get_json()
    username_or_email = data.get('username')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({"msg": "Username/Email and password required"}), 400

    # Look up by email or username
    auth = Authority.query.filter((Authority.email == username_or_email) | (Authority.username == username_or_email)).first()

    if auth and auth.check_password(password):
        access_token = create_access_token(
            identity=str(auth.id), 
            additional_claims={"role": "authority"},
            expires_delta=timedelta(days=1)
        )
        auth_dict = auth.to_dict()
        auth_dict['role'] = 'authority'
        return jsonify(access_token=access_token, user=auth_dict), 200

    return jsonify({"msg": "Invalid email/username or password"}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')

    if role == 'authority':
        user = Authority.query.get(user_id)
        if user:
            udict = user.to_dict()
            udict['role'] = 'authority'
    else:
        user = User.query.get(user_id)
        if user:
            udict = user.to_dict()
            udict['role'] = 'citizen'

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify(udict), 200

@auth_bp.route('/profile/stats', methods=['GET'])
@jwt_required()
def profile_stats():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')

    if role == 'authority':
        requests = ServiceRequest.query.filter_by(assigned_to=int(user_id)).all()
    else:
        requests = ServiceRequest.query.filter_by(reporter_id=int(user_id)).all()

    total = len(requests)
    resolved = sum(1 for r in requests if r.status == 'resolved')
    in_progress = total - resolved

    return jsonify({
        "total": total,
        "resolved": resolved,
        "in_progress": in_progress
    }), 200

@auth_bp.route('/profile/update', methods=['PUT'])
@jwt_required()
def profile_update():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')

    data = request.get_json()
    new_username = data.get('username')
    new_phone = data.get('phone')

    if role == 'authority':
        user = Authority.query.get(user_id)
    else:
        user = User.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Check for uniqueness if changing
    if new_username and new_username != user.username:
        if role == 'authority' and Authority.query.filter_by(username=new_username).first():
             return jsonify({"msg": "Username already taken"}), 400
        elif role == 'citizen' and User.query.filter_by(username=new_username).first():
             return jsonify({"msg": "Username already taken"}), 400
        user.username = new_username

    if new_phone and new_phone != user.phone:
        if role == 'authority' and Authority.query.filter_by(phone=new_phone).first():
             return jsonify({"msg": "Phone number already taken"}), 400
        elif role == 'citizen' and User.query.filter_by(phone=new_phone).first():
             return jsonify({"msg": "Phone number already taken"}), 400
        user.phone = new_phone

    db.session.commit()
    
    udict = user.to_dict()
    udict['role'] = role
    return jsonify({"msg": "Profile updated successfully", "user": udict}), 200

@auth_bp.route('/profile/upload', methods=['POST'])
@jwt_required()
def profile_upload():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')

    if 'profile_picture' not in request.files:
        return jsonify({"msg": "No file part"}), 400

    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
        new_filename = f"{role}_{user_id}_{os.urandom(4).hex()}.{ext}"
        
        upload_folder = os.path.join(current_app.root_path, 'static', 'profiles')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)

        image_url = f"http://127.0.0.1:5000/static/profiles/{new_filename}"

        if role == 'authority':
            user = Authority.query.get(user_id)
        else:
            user = User.query.get(user_id)
            
        user.profile_picture = image_url
        db.session.commit()

        udict = user.to_dict()
        udict['role'] = role
        return jsonify({"msg": "Profile picture updated successfully", "profile_picture": image_url, "user": udict}), 200

@auth_bp.route('/profile/change_password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'citizen')

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"msg": "Current and new password required"}), 400

    if role == 'authority':
        user = Authority.query.get(user_id)
    else:
        user = User.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    if not user.check_password(current_password):
        return jsonify({"msg": "Incorrect current password"}), 401

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"msg": "Password updated successfully"}), 200
