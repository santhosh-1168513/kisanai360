import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

# Import blueprints
from routes.auth import auth_bp
from routes.crops import crops_bp
from routes.disease import disease_bp
from routes.weather import weather_bp
from routes.voice import voice_bp
from routes.expert import expert_bp
from routes.crop_prices import crop_prices_bp
from routes.sms import sms_bp

from database import db

def seed_database():
    from models.water_models import FarmerModel, CropModel, SoilModel, WeatherHistoryModel, WaterRecommendationModel, IrrigationHistoryModel
    from datetime import datetime, timedelta
    import random
    
    # Check if already seeded
    if FarmerModel.query.filter_by(userId='farmer_1').first():
        return
        
    print("Seeding SQLite database with default farmer, crops, and histories...")
    
    # 1. Seed Farmer
    farmer = FarmerModel(
        userId='farmer_1',
        name='Ramesh Kumar',
        phone='+91 98765 43210',
        role='farmer',
        language='telugu',
        district='Guntur',
        village='Tenali',
        soilType='Red Soil',
        waterSource='Borewell',
        farmSize='2.5',
        previousCrop='Groundnut'
    )
    db.session.add(farmer)
    db.session.commit()
    
    # 2. Seed Crop
    crop = CropModel(
        name='Tomato',
        variety='Arka Rakshak',
        sowingDate=(datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d"),
        growthStage='Flowering',
        farmSize=2.5,
        irrigationMethod='Drip',
        userId='farmer_1'
    )
    db.session.add(crop)
    
    # 3. Seed Soil
    soil = SoilModel(
        soilType='Red Soil',
        moisture=28.5,
        ph=6.8,
        organicCarbon=0.45,
        userId='farmer_1'
    )
    db.session.add(soil)
    
    # 4. Seed Weather History & Water Recommendations for past 7 days
    base_date = datetime.utcnow() - timedelta(days=7)
    conditions = ["Partly Cloudy", "Sunny", "Rainy", "Drizzle", "Partly Cloudy", "Sunny", "Sunny"]
    
    for i in range(7):
        date_i = base_date + timedelta(days=i)
        date_str = date_i.isoformat()
        
        # Weather
        temp = 28 + random.uniform(-2, 3)
        hum = 65 + random.uniform(-10, 15)
        wind = 12 + random.uniform(-4, 5)
        rain = 0.0 if i != 2 and i != 3 else (4.5 if i == 2 else 1.2)
        uv = 5.0 + random.uniform(-1, 2)
        cloud = 30 + random.uniform(-10, 30)
        cond = conditions[i]
        
        weather = WeatherHistoryModel(
            temperature=round(temp, 1),
            humidity=round(hum, 1),
            windSpeed=round(wind, 1),
            rainfall=round(rain, 1),
            uvIndex=round(uv, 1),
            cloudCover=round(cloud, 1),
            condition=cond,
            timestamp=date_str,
            userId='farmer_1'
        )
        db.session.add(weather)
        
        # Recommendations
        if i == 2:
            status = "Postpone - Rain Expected"
            water_mm = 0
            duration = 0
            saved = 4500.0
            reasons = ["Heavy rain forecast in next 24 hours", "Maintain root aeration"]
        elif i % 3 == 0:
            status = "Irrigate Today"
            water_mm = 15 + random.randint(0, 10)
            duration = 60 + random.randint(0, 30)
            saved = 0.0
            reasons = ["Soil moisture is below vegetative threshold", "No rainfall expected"]
        else:
            status = "Skip - Optimal"
            water_mm = 0
            duration = 0
            saved = 2100.0
            reasons = ["Soil moisture in optimal range"]
            
        rec = WaterRecommendationModel(
            status=status,
            waterRequiredMm=water_mm,
            estimatedDurationMinutes=duration,
            recommendedTime="06:00 - 08:00",
            confidence=0.92 if status == "Irrigate Today" else 0.95,
            waterSavedLiters=saved,
            timestamp=date_str,
            userId='farmer_1'
        )
        rec.reasons = reasons
        db.session.add(rec)
        
        # Irrigation History
        if status == "Irrigate Today":
            irr = IrrigationHistoryModel(
                crop="Tomato",
                method="Drip",
                durationMinutes=duration,
                waterAppliedLiters=float(duration * 20),
                date=date_i.strftime("%Y-%m-%d"),
                status="Completed",
                userId='farmer_1'
            )
            db.session.add(irr)
            
    db.session.commit()
    print("Database seeding completed.")

def create_app():
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize SQLAlchemy database
    db.init_app(app)
    
    # Initialize application directories
    Config.init_app()
    
    # Enable CORS for the frontend server
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(crops_bp, url_prefix='/api/crops')
    app.register_blueprint(disease_bp, url_prefix='/api/disease')
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(voice_bp, url_prefix='/api/voice')
    app.register_blueprint(expert_bp, url_prefix='/api/expert')
    app.register_blueprint(crop_prices_bp, url_prefix='/api/crop-prices')
    app.register_blueprint(sms_bp, url_prefix='/api/sms')
    
    from routes.water_advisory import water_advisory_bp
    app.register_blueprint(water_advisory_bp, url_prefix='/api')
    
    # Create SQLite database structures on startup
    with app.app_context():
        db.create_all()
        seed_database()
    
    # Register direct ML recommendation endpoint mapping
    from routes.crops import recommend_crops
    app.route('/api/recommend-crops', methods=['POST'])(recommend_crops)
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "KisanAI 360 Backend",
            "api_version": "1.0.0"
        }), 200
        
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
