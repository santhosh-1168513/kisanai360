import os
from flask import Blueprint, request, jsonify, send_from_directory
from db import Database
from services.gemini_service import GeminiService
from config import Config
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

disease_bp = Blueprint('disease', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@disease_bp.route('/upload', methods=['POST'])
def upload_disease_image():
    userId = request.form.get('userId')
    crop_hint = request.form.get('cropHint', 'tomato')
    
    if not userId:
        return jsonify({"error": "userId is required"}), 400
        
    # Trigger kagglehub dataset path verification on upload as requested
    import kagglehub
    dataset_path = kagglehub.dataset_download("emmarex/plantdisease")
    print("Path to dataset files:", dataset_path)
        
    # Enforce file upload for real diagnosis
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded. Please upload a real leaf image."}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected. Please select a valid leaf image."}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PNG, JPG, JPEG, and WEBP formats are supported."}), 400
        
    filename = secure_filename(file.filename)
    unique_prefix = uuid.uuid4().hex[:8]
    saved_filename = f"{unique_prefix}_{filename}"
    file_path = os.path.join(Config.UPLOAD_FOLDER, saved_filename)
    file.save(file_path)
        
    symptoms_description = request.form.get('symptomsDescription')
    try:
        # Perform Gemini Vision diagnosis
        diagnosis = GeminiService.analyze_crop_disease(file_path, crop_hint, symptoms_description)
        
        # Save to DB
        record_id = f"dis_{uuid.uuid4().hex[:6]}"
        new_record = {
            "id": record_id,
            "userId": userId,
            "imageName": saved_filename,
            "imageURL": f"/api/disease/images/{saved_filename}",
            "crop": diagnosis.get('cropName', crop_hint.capitalize()),
            "diseaseName": diagnosis.get('diseaseName', 'Healthy Leaf'),
            "datasetLabel": diagnosis.get('datasetLabel', f"{crop_hint.capitalize()}___healthy"),
            "confidence": diagnosis.get('confidence', 95),
            "cause": diagnosis.get('cause', 'N/A'),
            "symptoms": diagnosis.get('symptoms', []),
            "chemicalTreatment": diagnosis.get('chemicalTreatment', 'None'),
            "organicTreatment": diagnosis.get('organicTreatment', 'None'),
            "preventionTips": diagnosis.get('preventionTips', []),
            "timestamp": datetime.now().isoformat()
        }
        
        Database.diseases.append(new_record)
        return jsonify({"success": True, "diagnosis": new_record}), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to diagnose image: {str(e)}"}), 500

@disease_bp.route('/history', methods=['GET'])
def get_history():
    userId = request.args.get('userId')
    if not userId:
        return jsonify({"error": "userId is required"}), 400
        
    user_diseases = [dis for dis in Database.diseases if dis['userId'] == userId]
    # Sort by timestamp descending
    user_diseases.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify({"success": True, "history": user_diseases}), 200

# Route to serve the uploaded images so the frontend can preview them
@disease_bp.route('/images/<filename>', methods=['GET'])
def get_uploaded_image(filename):
    if filename.startswith('demo_'):
        # Return empty response or mock placeholder since it's a demo file
        # We can also just send it from uploads if it exists
        pass
    return send_from_directory(Config.UPLOAD_FOLDER, filename)
