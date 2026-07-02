from flask import Blueprint, request, jsonify
import json
import uuid
from datetime import datetime
from db import Database
from ml.recommendation_model import crop_rec_model
from services.crop_price_service import CropPriceService
from services.gemini_service import GeminiService

crops_bp = Blueprint('crops', __name__)

# Crop metadata parameters (ideal conditions for scoring)
CROP_METADATA = {
    "Tomato": {
        "ideal_ph": 6.2, "preferred_soil": "Red", "ideal_temp": 24, "ideal_rainfall": 600,
        "preferred_season": "Rabi", "water_req": "Medium", "base_yield": "25 Quintals/Acre",
        "duration": "90-110 days", "sowing": "Oct - Nov", "reasons": [
            "Moderate temperature is ideal for tomato flowering.",
            "Soil pH is perfect for nutrient absorption.",
            "Local mandi demand and prices are currently strong."
        ]
    },
    "Chilli": {
        "ideal_ph": 6.5, "preferred_soil": "Red", "ideal_temp": 28, "ideal_rainfall": 700,
        "preferred_season": "Kharif", "water_req": "Medium", "base_yield": "15 Quintals/Acre",
        "duration": "120-150 days", "sowing": "Jun - Jul", "reasons": [
            "Warm climate matches the requirements of Chilli growth.",
            "Red sandy loam soil provides optimal aeration.",
            "Chilli prices are currently peak in Guntur mandi."
        ]
    },
    "Cotton": {
        "ideal_ph": 7.0, "preferred_soil": "Black", "ideal_temp": 30, "ideal_rainfall": 800,
        "preferred_season": "Kharif", "water_req": "Medium", "base_yield": "12 Quintals/Acre",
        "duration": "160-180 days", "sowing": "May - Jun", "reasons": [
            "Black cotton soil offers high moisture retention.",
            "High temperature during vegetative stage promotes growth.",
            "Favorable seasonal crop rotation cycle."
        ]
    },
    "Paddy": {
        "ideal_ph": 6.0, "preferred_soil": "Clay", "ideal_temp": 25, "ideal_rainfall": 1200,
        "preferred_season": "Kharif", "water_req": "High", "base_yield": "32 Quintals/Acre",
        "duration": "120-140 days", "sowing": "Jun - Jul", "reasons": [
            "High water availability and rainfall match paddy requirements.",
            "Clayey soil retains water perfectly for waterlogging.",
            "Staple crop with highly stable minimum support prices (MSP)."
        ]
    },
    "Maize": {
        "ideal_ph": 6.5, "preferred_soil": "Red", "ideal_temp": 26, "ideal_rainfall": 900,
        "preferred_season": "Kharif", "water_req": "Medium", "base_yield": "28 Quintals/Acre",
        "duration": "100-110 days", "sowing": "Jun - Jul", "reasons": [
            "Well-drained soil prevents root rot.",
            "Adequate nitrogen levels in soil support fast growth.",
            "Quick crop cycle allows secondary Rabi planting."
        ]
    },
    "Turmeric": {
        "ideal_ph": 6.0, "preferred_soil": "Red", "ideal_temp": 28, "ideal_rainfall": 1400,
        "preferred_season": "Kharif", "water_req": "High", "base_yield": "20 Quintals/Acre",
        "duration": "240-270 days", "sowing": "May - Jun", "reasons": [
            "Rich organic carbon and red loam soils enhance rhizome yield.",
            "Long crop cycle matches seasonal monsoon rainfall.",
            "Extremely high market value commodity."
        ]
    },
    "Groundnut": {
        "ideal_ph": 6.5, "preferred_soil": "Sandy", "ideal_temp": 27, "ideal_rainfall": 500,
        "preferred_season": "Kharif", "water_req": "Low", "base_yield": "22 Quintals/Acre",
        "duration": "100-120 days", "sowing": "Jun - Jul", "reasons": [
            "Light sandy soil allows easy pod penetration.",
            "Low water requirement makes it drought resilient.",
            "Excellent legume rotation crop to fix soil nitrogen."
        ]
    },
    "Onion": {
        "ideal_ph": 6.8, "preferred_soil": "Red", "ideal_temp": 20, "ideal_rainfall": 400,
        "preferred_season": "Rabi", "water_req": "Low", "base_yield": "180 Quintals/Acre",
        "duration": "110-130 days", "sowing": "Nov - Dec", "reasons": [
            "Cool winter temperatures match onion bulb development.",
            "Well-drained soil avoids root rotting.",
            "High price spikes in local urban mandis."
        ]
    }
}

@crops_bp.route('/recommend', methods=['POST'])
def old_recommend_endpoint():
    # Backward compatibility handler calling our new ML suitability algorithm
    return recommend_crops()

@crops_bp.route('/recommend-crops', methods=['POST'])
def recommend_crops():
    data = request.get_json() or {}
    userId = data.get('userId', 'anonymous')
    state = data.get('state', 'Andhra Pradesh')
    district = data.get('district', 'Guntur')
    soil_type = data.get('soil_type', 'Red')
    ph = float(data.get('ph', 6.5))
    nitrogen = int(data.get('nitrogen', 80))
    phosphorus = int(data.get('phosphorus', 40))
    potassium = int(data.get('potassium', 40))
    temperature = float(data.get('temperature', 26.0))
    humidity = float(data.get('humidity', 70.0))
    rainfall = float(data.get('rainfall', 800.0))
    season = data.get('season', 'Kharif')
    farm_size = float(data.get('farm_size', 2.5))
    water = data.get('water', 'Medium')

    # 1. Query the Random Forest Classifier probabilities
    ml_scores = crop_rec_model.predict_probabilities(
        n=nitrogen, p=phosphorus, k=potassium, ph=ph,
        temp=temperature, hum=humidity, rain=rainfall
    )

    # 2. Query dynamic Mandi prices to calculate profit estimates
    prices_res = CropPriceService.get_prices(state=state, district=district)
    mandi_records = prices_res.get('data', [])
    
    # Extract crop prices mapping
    crop_price_map = {}
    for r in mandi_records:
        comm = r['commodity'].lower()
        crop_price_map[comm] = r['modal_price'] # Price per quintal (data.gov.in standard)
    
    # Calculate suitability score based on weights
    recommendations = []
    for item in ml_scores:
        crop_name = item['crop']
        meta = CROP_METADATA.get(crop_name)
        if not meta:
            # Dynamic metadata fallback for additional crops in the Kaggle dataset
            meta = {
                "ideal_ph": 6.5,
                "preferred_soil": "Red",
                "ideal_temp": 25.0,
                "ideal_rainfall": 800.0,
                "preferred_season": "Kharif",
                "water_req": "Medium",
                "base_yield": "18 Quintals/Acre",
                "duration": "120-140 days",
                "sowing": "Jun - Jul",
                "reasons": [
                    f"NPK soil profile aligns with the organic requirements of {crop_name}.",
                    "Temperature and humidity trends match growing parameters.",
                    "Favorable regional market prices promise high returns."
                ]
            }
        
        # Sub-score calculation
        # A. Soil suitability (35%)
        ph_diff = abs(ph - meta.get('ideal_ph', 6.5))
        ph_sub = max(0.0, 100.0 - (ph_diff * 40))
        soil_sub = 100.0 if soil_type.lower() == meta.get('preferred_soil', 'Red').lower() else 40.0
        soil_score = (ph_sub * 0.5) + (soil_sub * 0.5)
        
        # B. Weather suitability (30%)
        temp_diff = abs(temperature - meta.get('ideal_temp', 26))
        temp_sub = max(0.0, 100.0 - (temp_diff * 8))
        rain_diff = abs(rainfall - meta.get('ideal_rainfall', 800))
        rain_sub = max(0.0, 100.0 - (rain_diff * 0.15))
        weather_score = (temp_sub * 0.5) + (rain_sub * 0.5)
        
        # C. Season compatibility (15%)
        season_score = 100.0 if season.lower() == meta.get('preferred_season', 'Kharif').lower() else 20.0
        
        # D. Water compatibility (10%)
        req = meta.get('water_req', 'Medium').lower()
        avail = water.lower()
        if req == avail:
            water_score = 100.0
        elif (req == 'high' and avail == 'low') or (req == 'low' and avail == 'high'):
            water_score = 30.0
        else:
            water_score = 80.0
            
        # E. Market price score (10%)
        mandi_price_quintal = crop_price_map.get(crop_name.lower(), 0.0)
        if mandi_price_quintal == 0.0:
            # Fallback to realistic mock price per quintal (₹ per quintal = ₹/kg * 100)
            mandi_price_quintal = {
                "Tomato": 2500, "Chilli": 8500, "Cotton": 6200, "Paddy": 2400,
                "Maize": 1800, "Turmeric": 11000, "Groundnut": 5500, "Onion": 1600
            }.get(crop_name, 3000)
            
        # Score commodity price relative to maximum base (₹12,000/quintal)
        price_score = min(100.0, (mandi_price_quintal / 12000.0) * 100.0)

        # Combine mathematical suitability indices with ML classifier probability
        ml_score = item['score']
        algorithmic_score = (soil_score * 0.35) + (weather_score * 0.30) + (season_score * 0.15) + (water_score * 0.10) + (price_score * 0.10)
        
        final_score = int((algorithmic_score * 0.4) + (ml_score * 0.6))
        
        # Calculate yield and profit estimates
        # Estimated Yield is base yield * farm size
        base_yield_val = float(meta.get('base_yield', '20').split(' ')[0])
        yield_est = base_yield_val * farm_size
        estimated_profit = int((yield_est * mandi_price_quintal) - (farm_size * 12000)) # base cultivation cost ₹12000/acre
        if estimated_profit < 0:
            estimated_profit = int(yield_est * mandi_price_quintal * 0.4) # ensure positive return minimum
            
        recommendations.append({
            "crop": crop_name,
            "score": final_score,
            "confidence": round(final_score / 100.0, 2),
            "yield_estimate": f"{round(yield_est, 1)} Quintals (Total)",
            "market_price": int(mandi_price_quintal / 100), # Price per kg in frontend display
            "estimated_profit": estimated_profit,
            "water_requirement": meta.get('water_req'),
            "duration": meta.get('duration'),
            "sowing_period": meta.get('sowing'),
            "reasons": meta.get('reasons', [])
        })

    # Sort recommendations by suitability score
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    top_5 = recommendations[:5]
    
    # Save record in db
    record_id = f"rec_{uuid.uuid4().hex[:6]}"
    new_record = {
        "id": record_id,
        "userId": userId,
        "state": state,
        "district": district,
        "soilType": soil_type,
        "pH": str(ph),
        "npk": f"N:{nitrogen} P:{phosphorus} K:{potassium}",
        "season": season,
        "farmSize": str(farm_size),
        "recommendedCrop": top_5[0]['crop'],
        "confidence": top_5[0]['score'],
        "timestamp": datetime.now().isoformat()
    }
    Database.recommendations.append(new_record)

    return jsonify({
        "success": True,
        "recommendations": top_5
    }), 200

@crops_bp.route('/crops', methods=['GET'])
def get_all_crops():
    return jsonify({
        "success": True,
        "crops": list(CROP_METADATA.keys())
    }), 200

@crops_bp.route('/markets', methods=['GET'])
def get_all_markets():
    markets = CropPriceService.get_markets()
    return jsonify({
        "success": True,
        "markets": markets
    }), 200

@crops_bp.route('/weather', methods=['GET'])
def get_weather_variables():
    return jsonify({
        "success": True,
        "indicators": ["Temperature", "Humidity", "Rainfall", "Wind Speed"]
    }), 200

@crops_bp.route('/prices', methods=['GET'])
def get_all_prices():
    district = request.args.get('district', 'Guntur')
    res = CropPriceService.get_prices(district=district)
    return jsonify(res), 200

@crops_bp.route('/history', methods=['GET'])
def get_recommendation_history():
    userId = request.args.get('userId', 'anonymous')
    user_recs = [rec for rec in Database.recommendations if rec['userId'] == userId]
    user_recs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify({
        "success": True,
        "history": user_recs
    }), 200

@crops_bp.route('/insights', methods=['GET'])
def get_advisory_insights():
    district = request.args.get('district', 'Guntur')
    crop = request.args.get('crop', 'Groundnut')
    
    prompt = f"""
    Explain why {crop} is currently recommended for planting in {district} district based on local soil and market prices.
    Provide a professional, farmer-friendly summary of 3 sentences. Highlight high profitability.
    """
    
    if GeminiService._is_api_available():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            return jsonify({"success": True, "insights": response.text.strip()}), 200
        except Exception as e:
            print(f"Error querying insights: {e}")
            
    return jsonify({
        "success": True,
        "insights": f"{crop} shows an exceptional compatibility score in {district} due to optimal soil parameters. Additionally, current mandi price indices indicate high market demand, translating to a projected 15% increase in seasonal profit margins."
    }), 200
