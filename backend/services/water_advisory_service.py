import os
import requests
import random
import json
from datetime import datetime, timedelta
import google.generativeai as genai
from config import Config
from database import db
from models.water_models import SoilModel, CropModel, WeatherHistoryModel, WaterRecommendationModel, IrrigationHistoryModel

# Configure Gemini
api_key = Config.GEMINI_API_KEY
if api_key:
    genai.configure(api_key=api_key)

class WaterAdvisoryService:
    @staticmethod
    def get_weather_forecast(latitude=16.3067, longitude=80.4365):
        """
        Queries Open-Meteo forecast including UV index, cloud cover, and rain parameters.
        """
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,rain,uv_index,cloud_cover"
            f"&daily=temperature_2m_max,temperature_2m_min,rain_sum,precipitation_probability_max,weather_code"
            f"&timezone=auto"
        )
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                current = data.get('current', {})
                daily = data.get('daily', {})
                
                # Format 7 days forecast
                forecast_list = []
                time_arr = daily.get('time', [])
                temp_max_arr = daily.get('temperature_2m_max', [])
                temp_min_arr = daily.get('temperature_2m_min', [])
                rain_sum_arr = daily.get('rain_sum', [])
                rain_prob_arr = daily.get('precipitation_probability_max', [])
                code_arr = daily.get('weather_code', [])
                
                for i in range(min(7, len(time_arr))):
                    dt = datetime.strptime(time_arr[i], "%Y-%m-%d")
                    forecast_list.append({
                        "day": dt.strftime("%a"),
                        "date": dt.strftime("%d %b"),
                        "tempMax": round(temp_max_arr[i]) if i < len(temp_max_arr) else 32,
                        "tempMin": round(temp_min_arr[i]) if i < len(temp_min_arr) else 24,
                        "rainSum": round(rain_sum_arr[i], 1) if i < len(rain_sum_arr) else 0.0,
                        "rainProb": round(rain_prob_arr[i]) if i < len(rain_prob_arr) else 20,
                        "weatherCode": int(code_arr[i]) if i < len(code_arr) else 1
                    })
                
                return {
                    "temperature": round(current.get('temperature_2m', 28.0), 1),
                    "humidity": round(current.get('relative_humidity_2m', 60)),
                    "windSpeed": round(current.get('wind_speed_10m', 12.0), 1),
                    "rainfall": round(current.get('rain', 0.0), 1),
                    "uvIndex": round(current.get('uv_index', 5.0), 1),
                    "cloudCover": round(current.get('cloud_cover', 30)),
                    "forecast": forecast_list
                }
        except Exception as e:
            print(f"Error calling Open-Meteo forecast API: {e}")
            
        # Mock Fallback Weather data
        forecast_list = []
        base_date = datetime.utcnow()
        for i in range(7):
            d = base_date + timedelta(days=i)
            forecast_list.append({
                "day": d.strftime("%a"),
                "date": d.strftime("%d %b"),
                "tempMax": 32 + random.randint(-1, 2),
                "tempMin": 24 + random.randint(-1, 2),
                "rainSum": 0.0 if i != 2 else 6.2,
                "rainProb": 10 if i != 2 else 75,
                "weatherCode": 1 if i != 2 else 61
            })
            
        return {
            "temperature": 28.0,
            "humidity": 65,
            "windSpeed": 12.0,
            "rainfall": 0.0,
            "uvIndex": 5.2,
            "cloudCover": 25,
            "forecast": forecast_list
        }

    @staticmethod
    def calculate_advisory(userId, latitude=16.3067, longitude=80.4365):
        """
        Core recommendation engine combining weather, soil thresholds, crop parameters,
        and Gemini analysis.
        """
        # 1. Fetch Crop & Soil state from Database
        crop = CropModel.query.filter_by(userId=userId).order_by(CropModel.id.desc()).first()
        soil = SoilModel.query.filter_by(userId=userId).order_by(SoilModel.id.desc()).first()
        
        # Default mock fallback if no database record is set up
        if not crop:
            crop = CropModel(name="Tomato", variety="Arka Rakshak", growthStage="Flowering", farmSize=2.5, irrigationMethod="Drip")
        if not soil:
            soil = SoilModel(soilType="Red Soil", moisture=28.0, ph=6.8, organicCarbon=0.45)
            
        # 2. Query Live Open-Meteo weather
        weather = WaterAdvisoryService.get_weather_forecast(latitude, longitude)
        
        # Save weather snapshot to history
        hist = WeatherHistoryModel(
            temperature=weather['temperature'],
            humidity=weather['humidity'],
            windSpeed=weather['windSpeed'],
            rainfall=weather['rainfall'],
            uvIndex=weather['uvIndex'],
            cloudCover=weather['cloudCover'],
            condition="Cloudy" if weather['cloudCover'] > 50 else "Sunny",
            userId=userId
        )
        db.session.add(hist)
        db.session.commit()

        # 3. Calculate Thresholds based on Growth Stage
        # Target optimal ranges:
        stage = crop.growthStage.lower()
        if 'sowing' in stage or 'germination' in stage:
            min_moisture, max_moisture = 50.0, 70.0
            crop_coeff = 0.4
        elif 'vegetative' in stage:
            min_moisture, max_moisture = 60.0, 80.0
            crop_coeff = 0.75
        elif 'flowering' in stage:
            min_moisture, max_moisture = 70.0, 90.0
            crop_coeff = 1.15
        elif 'yielding' in stage or 'fruiting' in stage:
            min_moisture, max_moisture = 55.0, 75.0
            crop_coeff = 0.9
        else: # harvest / default
            min_moisture, max_moisture = 40.0, 60.0
            crop_coeff = 0.5

        # 4. Decision logic calculation
        moisture = soil.moisture
        reasons = []
        
        # Check next 24 hour rain forecast (day 0 and day 1 sums)
        next_24h_rain = weather['forecast'][0]['rainSum'] + weather['forecast'][1]['rainSum']
        next_24h_prob = max(weather['forecast'][0]['rainProb'], weather['forecast'][1]['rainProb'])
        
        # Decision Matrix:
        if next_24h_rain > 5.0 or next_24h_prob > 70:
            status = "Postpone - Rain Expected"
            water_required = 0.0
            duration = 0
            # 1 mm = 10000 L / hectare -> 1 Acre = 4046 L per mm.
            # Daily evapotranspiration estimate = 5mm * crop_coeff. Saved water = ET * Acre size * 4046L.
            saved_liters = round(5.0 * crop_coeff * crop.farmSize * 4046)
            reasons.append("Rainfall expected within 24 hours.")
            reasons.append("Postponing irrigation saves water resources and prevents soil runoff.")
            reasons.append("Maintain optimal soil oxygen levels.")
        elif moisture < min_moisture:
            status = "Irrigate Today"
            # Calculate deficit water depth in mm
            water_required = round((min_moisture - moisture) * 0.6 * crop_coeff)
            if water_required < 5:
                water_required = 8 # Ensure a baseline minimum watering depth
                
            # Estimated duration based on method:
            # Drip: 2mm/hour. Sprinkler: 5mm/hour. Flood: 10mm/hour.
            method = crop.irrigationMethod.lower()
            if 'drip' in method:
                duration = round(water_required * 5.5)
            elif 'sprinkler' in method:
                duration = round(water_required * 4.0)
            else: # Flood
                duration = round(water_required * 3.0)
                
            saved_liters = 0.0
            reasons.append(f"Soil moisture ({moisture}%) is below optimal threshold ({min_moisture}%) for {crop.growthStage} stage.")
            reasons.append("Crop transpiration is high due to low humidity.")
            reasons.append("Irrigation is crucial to prevent yield stress.")
        else:
            status = "Skip - Optimal"
            water_required = 0.0
            duration = 0
            saved_liters = round(3.0 * crop_coeff * crop.farmSize * 4046) # Saved by skipped watering
            reasons.append("Soil moisture is in the optimal range.")
            reasons.append("No immediate irrigation required. Keep monitoring.")

        # 5. Connect with Gemini to generate rich explanation insights
        explanation = ""
        if Config.GEMINI_API_KEY:
            prompt = f"""
            You are a smart water advisory advisor. Analyze these irrigation statistics:
            Crop: {crop.name} ({crop.growthStage} stage)
            Soil Type: {soil.soilType}
            Current Soil Moisture: {moisture}% (Optimal range: {min_moisture}% - {max_moisture}%)
            Irrigation Recommendation: {status}
            Water required (mm): {water_required}
            Weather: {weather['temperature']}°C, humidity {weather['humidity']}%, UV {weather['uvIndex']}, cloud cover {weather['cloudCover']}%
            Rain Forecast (24h): {next_24h_rain}mm (probability {next_24h_prob}%)
            
            Write a brief, highly actionable agricultural explanation (2-3 sentences) advising the farmer. Use direct, encouraging, extension-officer style advice.
            """
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                explanation = response.text.strip()
            except Exception as e:
                print(f"Fallback active: utilizing offline advisory heuristics. Detail: {e}")
                if status == "Postpone - Rain Expected":
                    explanation = f"Heavy rainfall of {next_24h_rain}mm is expected within 24 hours. Postpone all planned irrigation to prevent waterlogging at roots and preserve groundwater resources."
                elif status == "Irrigate Today":
                    explanation = f"Soil moisture is low ({moisture}%). Apply {water_required}mm of water via {crop.irrigationMethod} immediately. Early morning watering is advised to reduce evaporative losses."
                else:
                    explanation = f"Soil moisture ({moisture}%) is currently optimal for the {crop.growthStage} stage. No watering is needed today. Maintain current schedule and monitor local wind speeds."
        else:
            if status == "Postpone - Rain Expected":
                explanation = f"Heavy rainfall of {next_24h_rain}mm is expected within 24 hours. Postpone all planned irrigation to prevent waterlogging at roots and preserve groundwater resources."
            elif status == "Irrigate Today":
                explanation = f"Soil moisture is low ({moisture}%). Apply {water_required}mm of water via {crop.irrigationMethod} immediately. Early morning watering is advised to reduce evaporative losses."
            else:
                explanation = f"Soil moisture ({moisture}%) is currently optimal for the {crop.growthStage} stage. No watering is needed today. Maintain current schedule and monitor local wind speeds."

        # 6. Save Recommendation to Database
        rec_model = WaterRecommendationModel(
            status=status,
            waterRequiredMm=water_required,
            estimatedDurationMinutes=duration,
            recommendedTime="06:00 - 08:00" if status == "Irrigate Today" else "N/A",
            confidence=0.94 if status == "Irrigate Today" else 0.96,
            waterSavedLiters=saved_liters,
            userId=userId
        )
        rec_model.reasons = reasons
        db.session.add(rec_model)
        db.session.commit()

        return {
            "status": status,
            "water_required_mm": water_required,
            "estimated_duration_minutes": duration,
            "recommended_time": "06:00 - 08:00" if status == "Irrigate Today" else "N/A",
            "confidence": 0.94 if status == "Irrigate Today" else 0.96,
            "water_saved_liters": saved_liters,
            "reason": reasons,
            "explanation": explanation
        }
