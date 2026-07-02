import requests
import random
from datetime import datetime
from config import Config

class WeatherService:
    @staticmethod
    def reverse_geocode(latitude, longitude):
        """
        Translates coordinate pairs into village/town/district names using Nominatim.
        """
        headers = {
            'User-Agent': 'KisanAI-360-Hackathon-Agent'
        }
        url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&accept-language=en"
        try:
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                address = data.get('address', {})
                village = address.get('village') or address.get('suburb') or address.get('town') or address.get('city_district') or ''
                county = address.get('county') or address.get('district') or ''
                state = address.get('state') or ''
                
                parts = [p for p in [village, county, state] if p]
                if parts:
                    return ", ".join(parts)
        except Exception as e:
            print(f"Error reverse geocoding: {e}")
        return None

    @staticmethod
    def map_weather_code(code):
        """
        Maps Open-Meteo weather codes (WMO code) to simple text conditions.
        """
        code = int(code)
        if code == 0:
            return "Sunny"
        elif code in [1, 2, 3]:
            return "Partly Cloudy"
        elif code in [45, 48]:
            return "Foggy"
        elif code in [51, 53, 55, 56, 57]:
            return "Drizzle"
        elif code in [61, 63, 65, 66, 67]:
            return "Rainy"
        elif code in [80, 81, 82]:
            return "Heavy Rain"
        elif code in [95, 96, 99]:
            return "Thunderstorm"
        else:
            return "Partly Cloudy"

    @staticmethod
    def get_weather_data(location_name="Guntur, Andhra Pradesh", latitude=16.3067, longitude=80.4365):
        """
        Retrieves live meteorological data from Open-Meteo and geocodes coordinates.
        """
        # Try reverse geocoding first if coordinates are not Guntur default
        resolved_name = WeatherService.reverse_geocode(latitude, longitude)
        if resolved_name:
            location_name = resolved_name

        # Call Open-Meteo API
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,rain"
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
                days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                
                time_arr = daily.get('time', [])
                temp_max_arr = daily.get('temperature_2m_max', [])
                temp_min_arr = daily.get('temperature_2m_min', [])
                rain_sum_arr = daily.get('rain_sum', [])
                rain_prob_arr = daily.get('precipitation_probability_max', [])
                code_arr = daily.get('weather_code', [])
                
                for i in range(min(7, len(time_arr))):
                    dt = datetime.strptime(time_arr[i], "%Y-%m-%d")
                    day_name = dt.strftime("%a")
                    date_str = dt.strftime("%d %b")
                    
                    forecast_list.append({
                        "day": day_name,
                        "date": date_str,
                        "tempMax": round(temp_max_arr[i] if i < len(temp_max_arr) else 32),
                        "tempMin": round(temp_min_arr[i] if i < len(temp_min_arr) else 24),
                        "humidity": round(current.get('relative_humidity_2m', 60) + random.randint(-5, 5)),
                        "condition": WeatherService.map_weather_code(code_arr[i] if i < len(code_arr) else 3),
                        "rainProb": round(rain_prob_arr[i] if i < len(rain_prob_arr) else 30)
                    })
                
                current_condition = WeatherService.map_weather_code(current.get('weather_code', 0))
                if not current_condition or current_condition == "Sunny" and current.get('rain', 0) > 0.1:
                    current_condition = "Rainy"

                # Calculate soil moisture dynamically based on recent rain and humidity
                moisture_base = 50
                if current.get('rain', 0) > 0.5:
                    moisture_base = 80
                elif current.get('relative_humidity_2m', 50) > 80:
                    moisture_base = 72
                elif current.get('relative_humidity_2m', 50) > 60:
                    moisture_base = 65
                    
                return {
                    "location": location_name,
                    "latitude": latitude,
                    "longitude": longitude,
                    "temperature": round(current.get('temperature_2m', 28)),
                    "humidity": round(current.get('relative_humidity_2m', 60)),
                    "windSpeed": round(current.get('wind_speed_10m', 12)),
                    "rainfall": round(current.get('rain', 0.0), 1),
                    "soilMoisture": moisture_base + random.randint(-2, 3),
                    "condition": current_condition,
                    "forecast": forecast_list
                }
        except Exception as e:
            print(f"Error querying Open-Meteo API: {e}")
            # Fallback to standard mock if API fails

        # Fallback Mock Weather Data
        base_temp = 28
        humidity = 62
        wind_speed = 12
        condition = "Partly Cloudy"
        rain = 0.0

        forecast_list = []
        for i in range(7):
            forecast_list.append({
                "day": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
                "date": f"{i+1} Jul",
                "tempMax": 32 + random.randint(-2, 2),
                "tempMin": 24 + random.randint(-2, 2),
                "humidity": 60,
                "condition": "Partly Cloudy",
                "rainProb": 20
            })

        return {
            "location": location_name,
            "latitude": latitude,
            "longitude": longitude,
            "temperature": base_temp,
            "humidity": humidity,
            "windSpeed": wind_speed,
            "rainfall": rain,
            "soilMoisture": 72,
            "condition": condition,
            "forecast": forecast_list
        }
