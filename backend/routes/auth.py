from flask import Blueprint, request, jsonify
from db import Database
import uuid
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    phone = data.get('phone')
    password = data.get('password')
    role = data.get('role', 'farmer') # farmer, expert, admin
    
    if not name or not phone or not password:
        return jsonify({"error": "Missing required fields"}), 400
        
    # Check if user already exists
    for uid, user in Database.users.items():
        if user['phone'] == phone:
            return jsonify({"error": "A user with this phone number already exists"}), 400
            
    userId = data.get('userId') or f"{role}_{uuid.uuid4().hex[:6]}"
    new_user = {
        "userId": userId,
        "name": name,
        "phone": phone,
        "password": password,
        "role": role,
        "language": data.get('language', 'english'),
        "district": data.get('district', ''),
        "village": data.get('village', ''),
        "soilType": data.get('soilType', ''),
        "waterSource": data.get('waterSource', ''),
        "farmSize": data.get('farmSize', ''),
        "previousCrop": data.get('previousCrop', ''),
        "createdAt": datetime.now().isoformat()
    }
    
    Database.users[userId] = new_user
    
    # Return user object excluding password
    user_copy = new_user.copy()
    user_copy.pop('password', None)
    return jsonify({"success": True, "user": user_copy}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    phone = data.get('phone')
    password = data.get('password')
    firebase_uid = data.get('userId')
    
    if firebase_uid:
        # Firebase authentication flow helper
        if firebase_uid in Database.users:
            user_copy = Database.users[firebase_uid].copy()
            user_copy.pop('password', None)
            return jsonify({"success": True, "user": user_copy}), 200
        else:
            # Create a profile on the fly for Firebase user if missing in local db
            name = data.get('name') or phone or "Firebase Farmer"
            role = data.get('role', 'farmer')
            new_user = {
                "userId": firebase_uid,
                "name": name,
                "phone": phone or "+91 98765 43210",
                "password": "firebase_oauth_user",
                "role": role,
                "language": data.get('language', 'english'),
                "district": "Guntur",
                "village": "Tenali",
                "soilType": "Red Soil",
                "waterSource": "Borewell",
                "farmSize": "2.5",
                "previousCrop": "Paddy",
                "createdAt": datetime.now().isoformat()
            }
            Database.users[firebase_uid] = new_user
            user_copy = new_user.copy()
            user_copy.pop('password', None)
            return jsonify({"success": True, "user": user_copy}), 200

    if not phone or not password:
        return jsonify({"error": "Phone and password are required"}), 400
        
    for uid, user in Database.users.items():
        if user['phone'] == phone and user['password'] == password:
            user_copy = user.copy()
            user_copy.pop('password', None)
            return jsonify({"success": True, "user": user_copy}), 200
            
    return jsonify({"error": "Invalid phone number or password"}), 401

@auth_bp.route('/profile', methods=['GET', 'PUT'])
def profile():
    # In a real app we'd use JWT or sessions. 
    # For this hackathon, we pass userId in header/query or body for fast integration.
    userId = request.headers.get('Authorization') or request.args.get('userId')
    
    if not userId or userId not in Database.users:
        return jsonify({"error": "Unauthorized"}), 401
        
    user = Database.users[userId]
    
    if request.method == 'PUT':
        data = request.get_json() or {}
        # Update editable fields
        user['name'] = data.get('name', user['name'])
        user['language'] = data.get('language', user['language'])
        user['district'] = data.get('district', user['district'])
        user['village'] = data.get('village', user['village'])
        user['soilType'] = data.get('soilType', user['soilType'])
        user['waterSource'] = data.get('waterSource', user['waterSource'])
        user['farmSize'] = str(data.get('farmSize', user['farmSize']))
        user['previousCrop'] = data.get('previousCrop', user['previousCrop'])
        
        Database.users[userId] = user
        
    user_copy = user.copy()
    user_copy.pop('password')
    return jsonify({"success": True, "user": user_copy}), 200
