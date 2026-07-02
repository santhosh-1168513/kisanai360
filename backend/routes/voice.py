from flask import Blueprint, request, jsonify
from services.gemini_service import GeminiService
from db import Database
import uuid
from datetime import datetime

voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/query', methods=['POST'])
def query_voice_assistant():
    data = request.get_json() or {}
    userId = data.get('userId')
    query_text = data.get('query')
    language = data.get('language', 'english')
    
    if not query_text:
        return jsonify({"error": "Query text is required"}), 400
        
    try:
        # Call Gemini voice service for localized response
        ai_response = GeminiService.get_voice_response(query_text, language)
        
        # Save to voice logs in db
        log_entry = {
            "id": f"voice_{uuid.uuid4().hex[:6]}",
            "userId": userId or "anonymous",
            "query": query_text,
            "response": ai_response.get('responseText'),
            "language": language,
            "timestamp": datetime.now().isoformat()
        }
        
        # In a real app we could append to a voice log collection
        # For simplicity, we just return the payload
        return jsonify({
            "success": True, 
            "response": ai_response.get('responseText'),
            "language": language,
            "log": log_entry
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Voice Assistant failed: {str(e)}"}), 500
