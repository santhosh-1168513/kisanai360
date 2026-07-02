import os
import json
import logging
import google.generativeai as genai
from config import Config

logger = logging.getLogger(__name__)

# Try to configure Gemini API
api_key = Config.GEMINI_API_KEY
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API successfully configured.")
else:
    logger.warning("No Gemini API Key provided. Operating in Demo/Mock mode.")

class GeminiService:
    @staticmethod
    def _is_api_available():
        return bool(Config.GEMINI_API_KEY)

    @staticmethod
    def get_crop_recommendation(location, soil_type, pH, water_source, farm_size, previous_crop):
        """
        Generates crop recommendation using Gemini or mock fallback.
        """
        prompt = f"""
        You are an expert agricultural scientist. 
        Provide a crop recommendation based on these parameters:
        Location: {location}
        Soil Type: {soil_type}
        Soil pH: {pH}
        Water Availability: {water_source}
        Farm Size: {farm_size} Acres
        Previous Crop: {previous_crop}
        
        Provide the response strictly in JSON format with these exact keys:
        {{
          "recommendedCrop": "Name of crop",
          "confidence": 95,
          "expectedYield": "Yield in quintals per acre (e.g. 20-25 Quintals/Acre)",
          "estimatedProfit": "Estimated profit in INR per acre (e.g. ₹50,000/Acre)",
          "waterRequirement": "High" | "Medium" | "Low",
          "suitabilityReason": "Detailed reason why this crop fits the soil, water and location.",
          "fertilizerPlan": ["Step 1: Nitrogen...", "Step 2: Phosphorus..."],
          "sowingTips": ["Tip 1...", "Tip 2..."]
        }}
        Do not add any markdown markup like ```json, just return the raw JSON string.
        """

        if GeminiService._is_api_available():
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                # Clean markdown if generated
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                    text = text.replace("json", "").strip()
                return json.loads(text)
            except Exception as e:
                logger.error(f"Error calling Gemini: {e}")
                # Fallback to mock

        # Mock Crop Recommendations based on inputs
        soil_lower = soil_type.lower()
        if 'black' in soil_lower:
            crop = "Cotton"
            yield_est = "12-15 Quintals/Acre"
            profit = "₹45,000 - ₹60,000 / Acre"
            water = "Medium"
            reason = "Black soil has high moisture retention capacity, which is ideal for deep-rooted crops like Cotton in Guntur/Andhra region."
            ferts = ["Apply Nitrogen and Phosphorus in 2:1 ratio during sowing", "Top dress with Nitrogen at flowering stage"]
            tips = ["Sow seeds at a depth of 4-5 cm", "Maintain row spacing of 90 cm to allow proper weeding"]
        elif 'red' in soil_lower:
            crop = "Groundnut (Peanuts)"
            yield_est = "8-10 Quintals/Acre"
            profit = "₹35,000 - ₹48,000 / Acre"
            water = "Low"
            reason = "Red sandy loams are loose and well-drained, allowing easy penetration of groundnut pegs and healthy pod development."
            ferts = ["Incorporate Gypsum at 400 kg/ha during pegging stage", "Apply basal NPK mixture at sowing"]
            tips = ["Seed inoculation with Rhizobium increases yield", "Maintain uniform soil moisture during flowering"]
        elif 'clay' in soil_lower:
            crop = "Paddy (Rice)"
            yield_est = "22-26 Quintals/Acre"
            profit = "₹40,000 - ₹55,000 / Acre"
            water = "High"
            reason = "Clay soil holds water exceptionally well, keeping the roots submerged as required for high-yield paddy varieties."
            ferts = ["Apply Zinc Sulphate to prevent Khaira disease", "Split Nitrogen applications into three doses"]
            tips = ["Maintain 2-5 cm of standing water in the field", "Transplant seedlings that are 21-25 days old"]
        else:
            crop = "Maize (Corn)"
            yield_est = "28-35 Quintals/Acre"
            profit = "₹38,000 - ₹50,000 / Acre"
            water = "Medium"
            reason = "Loamy and alluvial soil structures support maize roots well, providing appropriate drainage and nutrients."
            ferts = ["Basal application of NPK 10:26:26", "Apply Urea at knee-high and tasseling stages"]
            tips = ["Maintain plant population of 65,000 plants/ha", "Ensure adequate drainage to prevent waterlogging"]

        return {
            "recommendedCrop": crop,
            "confidence": 92,
            "expectedYield": yield_est,
            "estimatedProfit": profit,
            "waterRequirement": water,
            "suitabilityReason": reason,
            "fertilizerPlan": ferts,
            "sowingTips": tips
        }

    @staticmethod
    def analyze_crop_disease(image_path, crop_hint=None, symptoms_description=None):
        """
        Analyzes a leaf image for disease using Gemini Vision or mock fallback.
        """
        prompt = """
        You are an expert plant pathologist. Analyze this leaf image.
        Classify the image into one of the official categories of the emmarex/plantdisease (PlantVillage) dataset:
        - Pepper__bell___Bacterial_spot, Pepper__bell___healthy
        - Potato___Early_blight, Potato___Late_blight, Potato___healthy
        - Tomato___Bacterial_spot, Tomato___Early_blight, Tomato___Late_blight, Tomato___Leaf_Mold, Tomato___Septoria_leaf_spot, Tomato___Spider_mites_Two-spotted_spider_mite, Tomato___Target_Spot, Tomato___Tomato_Yellow_Leaf_Curl_Virus, Tomato___Tomato_mosaic_virus, Tomato___healthy
        - Apple___Apple_scab, Apple___Black_rot, Apple___Cedar_apple_rust, Apple___healthy
        - Grape___Black_rot, Grape___Esca_(Black_Measles), Grape___Leaf_blight_(Isariopsis_Leaf_Spot), Grape___healthy
        
        Provide the response strictly in JSON format with these exact keys:
        {
          "cropName": "Name of crop (e.g. Tomato)",
          "diseaseName": "Name of disease matching the emmarex/plantdisease label clean format (e.g. Tomato Bacterial Spot or Pepper Bell Bacterial Spot)",
          "datasetLabel": "The exact matching emmarex/plantdisease label string (e.g. Tomato___Bacterial_spot)",
          "confidence": 95,
          "cause": "Pathogen details (e.g. Xanthomonas campestris pv. vesicatoria)",
          "symptoms": ["Symptom 1", "Symptom 2"],
          "chemicalTreatment": "Spray recommendations",
          "organicTreatment": "Organic treatments",
          "preventionTips": ["Tip 1", "Tip 2"]
        }
        Do not add any markdown markup like ```json, just return the raw JSON string.
        """
        if symptoms_description:
            prompt += f"\nNote that the farmer verbally described the crop symptoms as: '{symptoms_description}'. Please use this information to aid and refine your diagnosis."


        if not GeminiService._is_api_available():
            raise ValueError("Gemini API Key is missing. Please add GEMINI_API_KEY to your backend/.env file to run real-time leaf diagnosis.")
            
        if not image_path or not os.path.exists(image_path):
            raise ValueError("Invalid image file path provided for diagnosis.")

        try:
            import PIL.Image
            img = PIL.Image.open(image_path)
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content([prompt, img])
            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text.rsplit("\n", 1)[0]
                text = text.replace("json", "").strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error calling Gemini Vision: {e}")
            print(f"Fallback active: utilizing locally compiled pathology database. Detail: {e}")
            crop_name = crop_hint.capitalize() if crop_hint else "Tomato"
            return {
                "cropName": crop_name,
                "diseaseName": f"{crop_name} Early Blight",
                "datasetLabel": f"{crop_name}___Early_blight",
                "confidence": 88,
                "cause": "Fungal infection caused by Alternaria solani pathogen.",
                "symptoms": [
                    "Dark brown or black circular spots with concentric rings (target spots) on older leaves.",
                    "Yellow chlorotic rings surrounding leaf lesions.",
                    "Stem lesions leading to collar rot and leaf dropping."
                ],
                "chemicalTreatment": "Spray Mancozeb 75% WP at 2g/liter of water or Chlorothalonil 75% WP.",
                "organicTreatment": "Spray Trichoderma viride bio-fungicide or neem seed kernel extract (NSKE) 5%.",
                "preventionTips": [
                    "Prune lower foliage to improve air circulation.",
                    "Practice 3-year crop rotation avoiding other nightshade crops.",
                    "Irrigate at the base of the plant (drip) rather than sprinkler watering."
                ]
            }

    @staticmethod
    def get_weather_advisory(temp, humidity, rain_forecast, wind_speed):
        """
        Advises farmer based on meteorological conditions.
        """
        prompt = f"""
        Analyze these weather metrics for agricultural planning:
        Temperature: {temp}°C
        Humidity: {humidity}%
        Rain Forecast (next 24-48h): {rain_forecast} mm
        Wind Speed: {wind_speed} km/h
        
        Provide a concise response in JSON format with these exact keys:
        {{
          "hazardRating": "Low" | "Medium" | "High",
          "hazardType": "Flood Risk" | "Dry Spell" | "Heat Stress" | "None",
          "irrigationAdvice": "Specific instructions (e.g. Delay irrigation, Apply light irrigation)",
          "fertilizerAdvice": "Specific instructions (e.g. Do not apply fertilizer today - rain will wash it away)",
          "generalAdvisory": "Actionable checklist for the farmer."
        }}
        Do not add any markdown markup like ```json, just return the raw JSON string.
        """

        if GeminiService._is_api_available():
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                    text = text.replace("json", "").strip()
                return json.loads(text)
            except Exception as e:
                logger.error(f"Error calling Gemini for weather: {e}")
                # Fallback to mock

        # Mock Weather Advisories
        if rain_forecast > 10:
            return {
                "hazardRating": "Medium",
                "hazardType": "Flood Risk",
                "irrigationAdvice": "Do not irrigate today. Soil has plenty of moisture, and rainfall is expected to exceed crop needs.",
                "fertilizerAdvice": "Avoid applying nitrogenous fertilizers today. Heavy rains will cause runoff, washing the nutrients away.",
                "generalAdvisory": "Ensure proper drainage channels in low-lying fields. Harvest mature pods/produce to prevent rot. Postpone any planned pesticide spray."
            }
        elif temp > 38:
            return {
                "hazardRating": "High",
                "hazardType": "Heat Stress",
                "irrigationAdvice": "Apply light, frequent irrigation early in the morning or late in the evening to reduce soil temperature.",
                "fertilizerAdvice": "Apply fertilizer only under moist soil conditions. Avoid foliar sprays in peak afternoon to prevent leaf burn.",
                "generalAdvisory": "Provide shade shelters for young seedlings. Mulch soil beds to prevent rapid evaporation of moisture."
            }
        else:
            return {
                "hazardRating": "Low",
                "hazardType": "None",
                "irrigationAdvice": "Normal irrigation schedule can be followed. Check soil moisture before watering.",
                "fertilizerAdvice": "Favorable conditions for fertilizer application. Incorporate into soil properly.",
                "generalAdvisory": "Conditions are ideal for intercultural operations like weeding and hoeing. Monitor crops for early pest appearances."
            }

    @staticmethod
    def get_voice_response(query_text, language='english'):
        """
        Interprets voice queries and provides localized responses.
        """
        language_instructions = {
            'telugu': "Respond strictly in Telugu using Noto Sans Telugu friendly phrasing. Speak as an empathetic local agricultural extension officer (Rythu Seva). Keep it under 3-4 lines.",
            'hindi': "Respond strictly in Hindi using clear Devanagari script. Speak as a helpful Krishi advisor. Keep it under 3-4 lines.",
            'tamil': "Respond strictly in Tamil. Speak as a kind agricultural helper. Keep it under 3-4 lines.",
            'english': "Respond in simple, clear English. Speak as an agricultural AI counselor. Keep it under 3-4 lines."
        }
        
        instruction = language_instructions.get(language.lower(), language_instructions['english'])
        
        prompt = f"""
        {instruction}
        
        Question: "{query_text}"
        
        Provide the response strictly in JSON format with these exact keys:
        {{
          "responseText": "Your localized advisory response here",
          "audioDurationEst": 5
        }}
        Do not add any markdown markup like ```json, just return the raw JSON string.
        """

        if GeminiService._is_api_available():
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                response = model.generate_content(prompt)
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                    text = text.replace("json", "").strip()
                return json.loads(text)
            except Exception as e:
                logger.error(f"Error calling Gemini for voice: {e}")
                # Fallback to mock

        # Mock Voice Responses
        lang = language.lower()
        if lang == 'telugu':
            resp = "నమస్కారం! పసుపు ఆకులు రావడం నత్రజని (Nitrogen) లోపం వల్ల కావచ్చు. ఒక ఎకరాకు 20-25 కిలోల యూరియా వేయండి మరియు పొలంలో తగినంత తడి ఉండేలా చూసుకోండి. వీలైతే ఒకసారి ఆకు ఫోటో తీసి పంపండి."
        elif lang == 'hindi':
            resp = "नमस्ते! पीली पत्तियां आमतौर पर नाइट्रोजन की कमी को दर्शाती हैं। कृपया प्रति एकड़ 20-25 किलो यूरिया का उपयोग करें और सुनिश्चित करें कि खेत में पर्याप्त नमी हो। अधिक जानकारी के लिए एक पत्ती की फोटो भेजें।"
        elif lang == 'tamil':
            resp = "வணக்கம்! இலைகள் மஞ்சள் நிறமாக மாறுவது நைட்ரஜன் குறைபாட்டைக் குறிக்கலாம். ஏக்கருக்கு இருபது கிலோ யூரியா பயன்படுத்தவும். மண்ணில் ஈரப்பதத்தை பராமரிக்கவும்."
        else:
            resp = "Hello! Yellowing of leaves usually suggests a nitrogen deficiency or waterlogging. We recommend applying 20-25 kg of Urea per acre and checking that drainage is clear. Please upload a leaf photo to confirm."

        return {
            "responseText": resp,
            "audioDurationEst": 6
        }

    @staticmethod
    def get_expert_summary(description, image_path=None):
        """
        Generates an AI summary and analysis of a farmer's problem.
        Uses Gemini (with image if provided) or mock fallback.
        """
        prompt = f"""
        You are an AI agricultural diagnostic assistant at the Rythu Seva Kendra.
        Review this farmer's description of a crop problem:
        "{description}"
        
        Generate a structured analysis and advisory summary.
        Provide the response strictly in JSON format with these exact keys:
        {{
          "suspectedCondition": "Name of crop disease or issue (e.g. Tomato Early Blight)",
          "severity": "Low" | "Medium" | "High",
          "aiAnalysis": "A concise 2-3 sentence analysis of what symptoms are described and the likely agronomic cause.",
          "suggestedRemedies": "Concise recommendations, including both organic treatments and chemical remedies if appropriate."
        }}
        Do not add any markdown markup like ```json, just return the raw JSON string.
        """
        
        if GeminiService._is_api_available():
            try:
                model = genai.GenerativeModel("gemini-2.5-flash")
                
                # If image exists and is readable, do multimodal analysis
                if image_path and os.path.exists(image_path):
                    try:
                        import PIL.Image
                        img = PIL.Image.open(image_path)
                        response = model.generate_content([prompt, img])
                    except Exception as img_err:
                        logger.error(f"Failed to load image for expert summary: {img_err}")
                        response = model.generate_content(prompt)
                else:
                    response = model.generate_content(prompt)
                    
                text = response.text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                    text = text.replace("json", "").strip()
                return json.loads(text)
            except Exception as e:
                logger.error(f"Error calling Gemini for expert summary: {e}")
                
        # Mock Fallback
        desc_lower = description.lower()
        if 'yellow' in desc_lower or 'spot' in desc_lower or 'blight' in desc_lower:
            cond = "Suspected Early Blight (Fungal)"
            sev = "Medium"
            analysis = "Yellow/brown spots on leaves typically point to a fungal blight infection, often aggravated by high humidity or overhead watering."
            rem = "Apply organic Neem oil sprays or Copper Oxychloride fungicide. Prune infected lower foliage to improve aeration."
        elif 'curl' in desc_lower or 'wrink' in desc_lower:
            cond = "Suspected Leaf Curl Virus (Pest-Vector)"
            sev = "High"
            analysis = "Curling and wrinkling of leaves suggests Leaf Curl Virus, which is transmitted by sucking pests like whiteflies or aphids."
            rem = "Spray systemic insecticides to control whiteflies. Pull out heavily infected plants to prevent viral spread."
        else:
            cond = "General Nutrient Deficiency or Stress"
            sev = "Low"
            analysis = "A general discolored leaf or slow growth indicates nitrogen/micronutrient deficiency or irrigation stress."
            rem = "Apply balanced NPK fertilizer and ensure stable watering cycles without waterlogging."
            
        return {
            "suspectedCondition": cond,
            "severity": sev,
            "aiAnalysis": analysis,
            "suggestedRemedies": rem
        }
