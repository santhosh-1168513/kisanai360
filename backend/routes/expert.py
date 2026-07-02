from flask import Blueprint, request, jsonify
from db import Database
from werkzeug.utils import secure_filename
from config import Config
import uuid
import os
from datetime import datetime

expert_bp = Blueprint('expert', __name__)

@expert_bp.route('/request', methods=['POST'])
def create_request():
    userId = request.form.get('userId')
    farmerName = request.form.get('farmerName', 'Farmer')
    phone = request.form.get('phone', '')
    description = request.form.get('description', '')
    
    if not userId or not description:
        return jsonify({"error": "userId and description are required"}), 400
        
    saved_filename = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            unique_prefix = uuid.uuid4().hex[:8]
            saved_filename = f"{unique_prefix}_{filename}"
            file_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)
            file.save(file_path)
            
    # AI Analysis & Summary generation
    from services.gemini_service import GeminiService
    target_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename) if saved_filename else None
    try:
        ai_summary = GeminiService.get_expert_summary(description, target_path)
    except Exception as e:
        ai_summary = {
            "suspectedCondition": "General Issue",
            "severity": "Low",
            "aiAnalysis": f"AI failed to generate analysis: {str(e)}",
            "suggestedRemedies": "Consult expert."
        }

    req_id = f"req_{uuid.uuid4().hex[:6]}"
    new_request = {
        "id": req_id,
        "userId": userId,
        "farmerName": farmerName,
        "phone": phone,
        "description": description,
        "imageName": saved_filename,
        "imageURL": f"/api/disease/images/{saved_filename}" if saved_filename else None,
        "status": "Pending",
        "expertReply": None,
        "expertName": None,
        "aiSummary": ai_summary,
        "timestamp": datetime.now().isoformat(),
        "replyTimestamp": None
    }
    
    Database.expert_requests.append(new_request)
    return jsonify({"success": True, "request": new_request}), 201

@expert_bp.route('/history', methods=['GET'])
def get_farmer_requests():
    userId = request.args.get('userId')
    if not userId:
        return jsonify({"error": "userId is required"}), 400
        
    reqs = [r for r in Database.expert_requests if r['userId'] == userId]
    reqs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify({"success": True, "requests": reqs}), 200

@expert_bp.route('/all', methods=['GET'])
def get_all_requests():
    # Sort pending first, then timestamp descending
    reqs = list(Database.expert_requests)
    reqs.sort(key=lambda x: (x['status'] != 'Pending', x['timestamp']), reverse=True)
    return jsonify({"success": True, "requests": reqs}), 200

@expert_bp.route('/reply', methods=['POST'])
def reply_to_request():
    data = request.get_json() or {}
    requestId = data.get('requestId')
    expertReply = data.get('expertReply')
    expertName = data.get('expertName', 'Dr. Srinivas Rao')
    
    if not requestId or not expertReply:
        return jsonify({"error": "requestId and expertReply are required"}), 400
        
    for req in Database.expert_requests:
        if req['id'] == requestId:
            req['status'] = 'Answered'
            req['expertReply'] = expertReply
            req['expertName'] = expertName
            req['replyTimestamp'] = datetime.now().isoformat()
            
            # Create a user notification in the alerts collection as well
            notification = {
                "id": f"alert_{uuid.uuid4().hex[:6]}",
                "title": "Expert Query Answered",
                "message": f"Your consultation query '{req['description'][:30]}...' has been answered by {expertName}.",
                "type": "expert",
                "level": "low",
                "timestamp": datetime.now().isoformat(),
                "smsSent": True
            }
            Database.alerts.insert(0, notification)
            
            return jsonify({"success": True, "request": req}), 200
            
    return jsonify({"error": "Request not found"}), 404

@expert_bp.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    total_farmers = len([u for u in Database.users.values() if u['role'] == 'farmer'])
    total_experts = len([u for u in Database.users.values() if u['role'] == 'expert'])
    pending_queries = len([r for r in Database.expert_requests if r['status'] == 'Pending'])
    answered_queries = len([r for r in Database.expert_requests if r['status'] == 'Answered'])
    total_alerts = len(Database.alerts)
    
    # Calculate crop stats distribution
    crop_stats = {}
    for rec in Database.recommendations:
        crop = rec['recommendedCrop']
        crop_stats[crop] = crop_stats.get(crop, 0) + 1
        
    # Standard fallback crop counts for demo
    if not crop_stats:
        crop_stats = {"Maize": 12, "Cotton": 8, "Groundnut": 15, "Paddy": 10}
        
    # Crop disease distribution
    disease_stats = {}
    for dis in Database.diseases:
        name = dis['diseaseName']
        disease_stats[name] = disease_stats.get(name, 0) + 1
        
    if not disease_stats:
        disease_stats = {"Tomato Early Blight": 5, "Chili Leaf Curl": 3, "Aphid Infestation": 2}
        
    # Pest outbreak heatmap simulation (districts and risk level 0-100)
    pest_heatmap = [
        {"district": "Guntur", "lat": 16.3067, "lng": 80.4365, "risk": 75, "pest": "Aphids"},
        {"district": "Krishna", "lat": 16.1809, "lng": 81.1303, "risk": 40, "pest": "Stem Borer"},
        {"district": "Prakasam", "lat": 15.5057, "lng": 80.0499, "risk": 20, "pest": "Bollworm"},
        {"district": "Kurnool", "lat": 15.8281, "lng": 78.0373, "risk": 90, "pest": "Leaf Folder"},
        {"district": "Anantapur", "lat": 14.6819, "lng": 77.6006, "risk": 65, "pest": "Root Rot"}
    ]
        
    return jsonify({
        "success": True,
        "stats": {
            "totalFarmers": total_farmers,
            "totalExperts": total_experts,
            "pendingQueries": pending_queries,
            "answeredQueries": answered_queries,
            "totalAlerts": total_alerts,
            "cropDistribution": crop_stats,
            "diseaseDistribution": disease_stats,
            "pestHeatmap": pest_heatmap
        }
    }), 200
