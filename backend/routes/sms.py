from flask import Blueprint, request, jsonify
from db import Database
import uuid
import os
from datetime import datetime

# Optional Twilio Import
try:
    from twilio.rest import Client as TwilioClient
except ImportError:
    TwilioClient = None

sms_bp = Blueprint('sms', __name__)

@sms_bp.route('/send', methods=['POST'])
def send_sms():
    data = request.get_json() or {}
    userId = data.get('userId', 'farmer_1')
    phone = data.get('phone', '+91 98765 43210')
    message = data.get('message', '')
    title = data.get('title', 'Agricultural Advisory')
    level = data.get('level', 'low')
    
    if not message:
        return jsonify({"success": False, "error": "Message content is required"}), 400
        
    sms_id = f"sms_{uuid.uuid4().hex[:6]}"
    
    # Twilio integration keys
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    
    real_sms_status = "simulated"
    twilio_error = None
    
    if account_sid and auth_token and from_number and TwilioClient:
        try:
            client = TwilioClient(account_sid, auth_token)
            # Make sure we clean the phone number to E.164 format (e.g. +91XXXXXXXXXX)
            cleaned_phone = phone.strip()
            if not cleaned_phone.startswith('+'):
                # Add default country code if missing
                cleaned_phone = f"+91{cleaned_phone.replace(' ', '')}"
            
            # Truncate message to 120 chars to avoid Twilio Trial account length errors
            sms_body = message
            if len(sms_body) > 120:
                sms_body = sms_body[:117] + "..."

            client.messages.create(
                body=sms_body,
                from_=from_number,
                to=cleaned_phone
            )
            real_sms_status = "dispatched"
            print(f"SMS successfully dispatched via Twilio to {cleaned_phone}")
        except Exception as e:
            twilio_error = str(e)
            print(f"Twilio failed to send SMS: {e}")
            return jsonify({
                "success": False,
                "error": f"Twilio API Error: {twilio_error}. Please verify your Twilio FROM number is correct in your backend/.env, and the recipient number is verified in your Twilio Console (if using a trial account)."
            }), 400
    else:
        print("Twilio credentials are not set in .env. Falling back to local simulation mode.")
        
    # Log simulated SMS to alerts collection so it shows on the UI dashboard alerts log
    alert_entry = {
        "id": f"alert_{uuid.uuid4().hex[:6]}",
        "title": f"SMS: {title}",
        "message": f"[{real_sms_status.upper()} to {phone}]: {message}",
        "type": "sms",
        "level": level,
        "timestamp": datetime.now().isoformat(),
        "smsSent": True
    }
    
    Database.alerts.insert(0, alert_entry)
    
    return jsonify({
        "success": True,
        "smsId": sms_id,
        "recipient": phone,
        "status": real_sms_status,
        "error": twilio_error,
        "message": message,
        "timestamp": alert_entry['timestamp']
    }), 200
