from flask import Blueprint, request, jsonify
from services.water_advisory_service import WaterAdvisoryService
from models.water_models import db, SoilModel, CropModel, WeatherHistoryModel, WaterRecommendationModel, IrrigationHistoryModel
from datetime import datetime

water_advisory_bp = Blueprint('water_advisory', __name__)

@water_advisory_bp.route('/water-advisory', methods=['POST'])
def get_water_advisory():
    data = request.get_json() or {}
    userId = data.get('userId', 'farmer_1')
    latitude = float(data.get('latitude', 16.3067))
    longitude = float(data.get('longitude', 80.4365))
    
    # Check if they updated soil data within this request
    soil_type = data.get('soilType')
    moisture = data.get('moisture')
    ph = data.get('ph')
    organic_carbon = data.get('organicCarbon')
    
    if moisture is not None:
        # Create a new soil sensor entry
        new_soil = SoilModel(
            soilType=soil_type or 'Red Soil',
            moisture=float(moisture),
            ph=float(ph or 6.5),
            organicCarbon=float(organic_carbon or 0.4) if organic_carbon else None,
            userId=userId
        )
        db.session.add(new_soil)
        
    # Check if they updated crop details in this request
    crop_name = data.get('cropName')
    growth_stage = data.get('growthStage')
    irrigation_method = data.get('irrigationMethod')
    farm_size = data.get('farmSize')
    
    if crop_name:
        new_crop = CropModel(
            name=crop_name,
            variety=data.get('variety', 'Standard'),
            sowingDate=data.get('sowingDate', datetime.utcnow().strftime("%Y-%m-%d")),
            growthStage=growth_stage or 'Vegetative',
            farmSize=float(farm_size or 1.0),
            irrigationMethod=irrigation_method or 'Drip',
            userId=userId
        )
        db.session.add(new_crop)
        
    db.session.commit()
    
    try:
        # Run calculation engine
        advisory = WaterAdvisoryService.calculate_advisory(userId, latitude, longitude)
        return jsonify({"success": True, "advisory": advisory}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@water_advisory_bp.route('/weather', methods=['GET'])
def get_weather():
    latitude = float(request.args.get('latitude', 16.3067))
    longitude = float(request.args.get('longitude', 80.4365))
    try:
        weather = WaterAdvisoryService.get_weather_forecast(latitude, longitude)
        return jsonify({"success": True, "weather": weather}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@water_advisory_bp.route('/forecast', methods=['GET'])
def get_forecast():
    latitude = float(request.args.get('latitude', 16.3067))
    longitude = float(request.args.get('longitude', 80.4365))
    try:
        weather = WaterAdvisoryService.get_weather_forecast(latitude, longitude)
        return jsonify({"success": True, "forecast": weather['forecast']}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@water_advisory_bp.route('/soil', methods=['GET'])
def get_soil():
    userId = request.args.get('userId', 'farmer_1')
    soil = SoilModel.query.filter_by(userId=userId).order_by(SoilModel.id.desc()).first()
    if soil:
        return jsonify({
            "success": True,
            "soil": {
                "soilType": soil.soilType,
                "moisture": soil.moisture,
                "ph": soil.ph,
                "organicCarbon": soil.organicCarbon,
                "timestamp": soil.timestamp
            }
        }), 200
    return jsonify({"success": True, "soil": None}), 200

@water_advisory_bp.route('/irrigation-history', methods=['GET'])
def get_irrigation_history():
    userId = request.args.get('userId', 'farmer_1')
    history = IrrigationHistoryModel.query.filter_by(userId=userId).order_by(IrrigationHistoryModel.id.desc()).all()
    res = []
    for h in history:
        res.append({
            "id": h.id,
            "crop": h.crop,
            "method": h.method,
            "durationMinutes": h.durationMinutes,
            "waterAppliedLiters": h.waterAppliedLiters,
            "date": h.date,
            "status": h.status
        })
    return jsonify({"success": True, "history": res}), 200

@water_advisory_bp.route('/water-usage', methods=['GET'])
def get_water_usage():
    userId = request.args.get('userId', 'farmer_1')
    recs = WaterRecommendationModel.query.filter_by(userId=userId).order_by(WaterRecommendationModel.id.asc()).all()
    history = IrrigationHistoryModel.query.filter_by(userId=userId).order_by(IrrigationHistoryModel.id.asc()).all()
    
    # 7-day trend arrays
    usage_trend = []
    savings_trend = []
    moisture_trend = []
    
    # Grab soil moisture trend
    soils = SoilModel.query.filter_by(userId=userId).order_by(SoilModel.id.desc()).limit(7).all()
    soils.reverse()
    for s in soils:
        dt = datetime.fromisoformat(s.timestamp)
        moisture_trend.append({
            "day": dt.strftime("%a"),
            "moisture": s.moisture
        })
        
    for r in recs[-7:]:
        dt = datetime.fromisoformat(r.timestamp)
        savings_trend.append({
            "day": dt.strftime("%a"),
            "saved": r.waterSavedLiters
        })
        
    for h in history[-7:]:
        usage_trend.append({
            "day": h.date.split('-')[-1] + " " + datetime.strptime(h.date, "%Y-%m-%d").strftime("%b"),
            "used": h.waterAppliedLiters
        })
        
    # Standard metrics
    total_saved = sum([r.waterSavedLiters for r in recs]) if recs else 0.0
    total_used = sum([h.waterAppliedLiters for h in history]) if history else 0.0
    
    return jsonify({
        "success": True,
        "metrics": {
            "totalSavedLiters": total_saved,
            "totalUsedLiters": total_used,
            "electricitySavedINR": round(total_saved * 0.15)
        },
        "trends": {
            "waterUsage": usage_trend,
            "waterSavings": savings_trend,
            "soilMoisture": moisture_trend
        }
    }), 200
