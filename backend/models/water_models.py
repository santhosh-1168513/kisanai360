from database import db
from datetime import datetime
import json

class FarmerModel(db.Model):
    __tablename__ = 'farmers'
    userId = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), default='farmer')
    language = db.Column(db.String(20), default='english')
    district = db.Column(db.String(50))
    village = db.Column(db.String(50))
    soilType = db.Column(db.String(50))
    waterSource = db.Column(db.String(50))
    farmSize = db.Column(db.String(10))
    previousCrop = db.Column(db.String(50))
    createdAt = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())

class CropModel(db.Model):
    __tablename__ = 'crops'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    variety = db.Column(db.String(50))
    sowingDate = db.Column(db.String(50))
    growthStage = db.Column(db.String(30))  # Germination, Vegetative, Flowering, Fruiting, Harvest
    farmSize = db.Column(db.Float, default=1.0)
    irrigationMethod = db.Column(db.String(30))  # Drip, Sprinkler, Flood
    userId = db.Column(db.String(50), db.ForeignKey('farmers.userId'))

class SoilModel(db.Model):
    __tablename__ = 'soils'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    soilType = db.Column(db.String(50), nullable=False)
    moisture = db.Column(db.Float, nullable=False)  # %
    ph = db.Column(db.Float, nullable=False)
    organicCarbon = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    userId = db.Column(db.String(50), db.ForeignKey('farmers.userId'))

class WeatherHistoryModel(db.Model):
    __tablename__ = 'weather_histories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    windSpeed = db.Column(db.Float)
    rainfall = db.Column(db.Float)
    uvIndex = db.Column(db.Float)
    cloudCover = db.Column(db.Float)
    condition = db.Column(db.String(50))
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    userId = db.Column(db.String(50), db.ForeignKey('farmers.userId'))

class WaterRecommendationModel(db.Model):
    __tablename__ = 'water_recommendations'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(db.String(50))  # Irrigate Today, Skip - Optimal, Postpone - Rain Expected
    waterRequiredMm = db.Column(db.Float)
    estimatedDurationMinutes = db.Column(db.Integer)
    recommendedTime = db.Column(db.String(50))
    confidence = db.Column(db.Float)
    waterSavedLiters = db.Column(db.Float)
    _reasons = db.Column('reasons', db.Text)  # JSON serialized array of strings
    timestamp = db.Column(db.String(50), default=lambda: datetime.utcnow().isoformat())
    userId = db.Column(db.String(50), db.ForeignKey('farmers.userId'))

    @property
    def reasons(self):
        return json.loads(self._reasons) if self._reasons else []

    @reasons.setter
    def reasons(self, value):
        self._reasons = json.dumps(value)

class IrrigationHistoryModel(db.Model):
    __tablename__ = 'irrigation_histories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop = db.Column(db.String(50))
    method = db.Column(db.String(50))
    durationMinutes = db.Column(db.Integer)
    waterAppliedLiters = db.Column(db.Float)
    date = db.Column(db.String(50))
    status = db.Column(db.String(20))  # Completed, Interrupted
    userId = db.Column(db.String(50), db.ForeignKey('farmers.userId'))
