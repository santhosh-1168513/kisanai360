from flask import Blueprint, request, jsonify
from services.weather_service import WeatherService
from services.gemini_service import GeminiService
from db import Database

weather_bp = Blueprint('weather', __name__)

@weather_bp.route('/dashboard', methods=['GET'])
def get_dashboard_weather():
    location = request.args.get('location', 'Guntur, Andhra Pradesh')
    lat = float(request.args.get('lat', 16.3067))
    lon = float(request.args.get('lon', 80.4365))
    
    weather_data = WeatherService.get_weather_data(location, lat, lon)
    
    # Generate AI weather advisory based on these conditions
    try:
        ai_advisory = GeminiService.get_weather_advisory(
            temp=weather_data['temperature'],
            humidity=weather_data['humidity'],
            rain_forecast=weather_data['rainfall'],
            wind_speed=weather_data['windSpeed']
        )
        weather_data['aiAdvisory'] = ai_advisory
    except Exception as e:
        weather_data['aiAdvisory'] = {
            "hazardRating": "Low",
            "hazardType": "None",
            "irrigationAdvice": "Maintain standard soil moisture. No immediate rain risks.",
            "fertilizerAdvice": "Appropriate conditions for nitrogen application.",
            "generalAdvisory": "Keep field boundaries clear. Monitor crops daily."
        }
        
    return jsonify({"success": True, "weather": weather_data}), 200

@weather_bp.route('/alerts', methods=['GET'])
def get_alerts():
    userId = request.args.get('userId')
    # Filter or return all general alerts + personal alerts
    # In-memory DB has 3 default alerts
    return jsonify({"success": True, "alerts": Database.alerts}), 200
