import uuid
from datetime import datetime

# In-Memory Database (simulating Firestore collections)
class Database:
    users = {
        "farmer_1": {
            "userId": "farmer_1",
            "name": "Ramesh Kumar",
            "phone": "+91 98765 43210",
            "password": "password", # Plaintext for simple hackathon mock auth
            "role": "farmer",
            "language": "telugu",
            "district": "Guntur",
            "village": "Tenali",
            "soilType": "Red Soil",
            "waterSource": "Borewell",
            "farmSize": "2.5",
            "previousCrop": "Groundnut",
            "createdAt": "2026-06-01T12:00:00Z"
        },
        "expert_1": {
            "userId": "expert_1",
            "name": "Dr. Srinivas Rao",
            "phone": "+91 88888 88888",
            "password": "password",
            "role": "expert",
            "center": "Rythu Seva Kendra, Guntur",
            "createdAt": "2026-06-01T12:00:00Z"
        },
        "admin_1": {
            "userId": "admin_1",
            "name": "KisanAI Admin",
            "phone": "+91 99999 99999",
            "password": "admin",
            "role": "admin",
            "createdAt": "2026-06-01T12:00:00Z"
        }
    }

    recommendations = [
        {
            "id": "rec_1",
            "userId": "farmer_1",
            "location": "Guntur",
            "soilType": "Red Soil",
            "pH": "6.8",
            "waterSource": "Borewell",
            "farmSize": "2.5",
            "previousCrop": "Groundnut",
            "recommendedCrop": "Maize",
            "confidence": 96,
            "expectedYield": "42 Quintals/acre",
            "estimatedProfit": "₹72,000/acre",
            "waterRequirement": "Medium",
            "suitabilityReason": "Maize matches Guntur's weather pattern and the farm's red soil characteristics perfectly, yielding high profit margins.",
            "timestamp": "2026-07-01T11:00:00Z"
        }
    ]

    diseases = [
        {
            "id": "dis_1",
            "userId": "farmer_1",
            "imageName": "leaf_early_blight.jpg",
            "crop": "Tomato",
            "diseaseName": "Tomato Early Blight",
            "confidence": 95,
            "cause": "Fungal disease caused by Alternaria solani.",
            "chemicalTreatment": "Spray Mancozeb 75% WP",
            "organicTreatment": "Neem oil spray, Trichoderma viride",
            "timestamp": "2026-07-01T09:30:00Z"
        }
    ]

    alerts = [
        {
            "id": "alert_1",
            "title": "Storm & Rain Warning",
            "message": "Heavy rain forecast within 24 hours. Ensure field drainage channels are open and postpone fertilizing.",
            "type": "rain",
            "level": "high",
            "timestamp": "2026-07-02T10:00:00Z",
            "smsSent": True
        },
        {
            "id": "alert_2",
            "title": "Blight Infection Alert",
            "message": "Early Blight outbreaks reported in neighboring farms. Inspect bottom leaves for brown concentric target spots.",
            "type": "disease",
            "level": "medium",
            "timestamp": "2026-07-02T08:30:00Z",
            "smsSent": True
        },
        {
            "id": "alert_3",
            "title": "Optimal Soil Moisture",
            "message": "Soil moisture level is optimal (74%). Irrigation recommendation postponed by 24 hours to conserve water.",
            "type": "water",
            "level": "low",
            "timestamp": "2026-07-01T15:00:00Z",
            "smsSent": True
        },
        {
            "id": "alert_4",
            "title": "Mandi Price Surge Alert",
            "message": "Tomato selling price in Tenali Mandi has surged by 15% to ₹48/kg. Consider harvesting mature crops today.",
            "type": "market",
            "level": "low",
            "timestamp": "2026-07-01T09:00:00Z",
            "smsSent": True
        },
        {
            "id": "alert_5",
            "title": "RSK Consultation Replied",
            "message": "Specialist Dr. Srinivas Rao has reviewed and answered your Tomato crop health inquiry.",
            "type": "expert",
            "level": "low",
            "timestamp": "2026-06-30T16:45:00Z",
            "smsSent": True
        }
    ]

    expert_requests = [
        {
            "id": "req_1",
            "userId": "farmer_1",
            "farmerName": "Ramesh Kumar",
            "phone": "+91 98765 43210",
            "description": "Tomato leaves have yellow spots and turning brown.",
            "imageName": "tomato_spots.jpg",
            "status": "Answered",
            "expertReply": "This is a classic symptom of early blight. Ensure you prune the bottom leaves and apply a copper-based fungicide. Avoid watering the leaves directly.",
            "expertName": "Dr. Srinivas Rao",
            "timestamp": "2026-07-01T08:00:00Z",
            "replyTimestamp": "2026-07-01T14:30:00Z"
        }
    ]
