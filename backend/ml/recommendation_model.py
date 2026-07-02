import os
import requests
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

class CropModel:
    CROP_MAP_CLEAN = {
        'rice': 'Paddy',
        'maize': 'Maize',
        'chickpea': 'Chickpea',
        'kidneybeans': 'Kidney Beans',
        'pigeonpeas': 'Pigeon Peas',
        'mothbeans': 'Moth Beans',
        'mungbean': 'Mung Bean',
        'blackgram': 'Black Gram',
        'lentil': 'Lentil',
        'pomegranate': 'Pomegranate',
        'banana': 'Banana',
        'mango': 'Mango',
        'grapes': 'Grapes',
        'watermelon': 'Watermelon',
        'muskmelon': 'Muskmelon',
        'apple': 'Apple',
        'orange': 'Orange',
        'papaya': 'Papaya',
        'coconut': 'Coconut',
        'cotton': 'Cotton',
        'jute': 'Jute',
        'coffee': 'Coffee'
    }

    def __init__(self):
        self.model = None
        self.classes_ = []
        self._load_and_train()

    def _load_and_train(self):
        """
        Downloads the official Crop Recommendation CSV from GitHub mirror if missing,
        loads it, and trains a RandomForestClassifier.
        """
        dir_path = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(dir_path, 'Crop_recommendation.csv')
        
        # Download if missing
        if not os.path.exists(csv_path):
            print("Downloading crop recommendation dataset from GitHub mirror...")
            url = "https://raw.githubusercontent.com/gabbygab1233/Crop-Recommender/master/Crop_recommendation.csv"
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    with open(csv_path, 'w', encoding='utf-8') as f:
                        f.write(r.text)
                    print("Dataset downloaded successfully.")
                else:
                    raise Exception(f"Failed to fetch CSV: {r.status_code}")
            except Exception as e:
                print(f"Error downloading dataset: {e}. Falling back to synthetic training.")
                self._train_synthetic()
                return

        # Load real dataset
        try:
            df = pd.read_csv(csv_path)
            X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
            y = df['label']
            
            self.model = RandomForestClassifier(n_estimators=50, random_state=42)
            self.model.fit(X, y)
            self.classes_ = self.model.classes_
            print(f"Random Forest model trained successfully on {len(df)} records.")
        except Exception as e:
            print(f"Error loading/training on real CSV: {e}. Re-training synthetic fallback.")
            self._train_synthetic()

    def _train_synthetic(self):
        import numpy as np
        X_synth = []
        y_synth = []
        crops = list(self.CROP_MAP_CLEAN.keys())
        for idx, crop in enumerate(crops):
            for _ in range(50):
                n = max(0, int(np.random.normal(60, 15)))
                p = max(0, int(np.random.normal(45, 10)))
                k = max(0, int(np.random.normal(40, 10)))
                ph = max(4.0, min(9.5, np.random.normal(6.5, 0.5)))
                temp = np.random.normal(26.0, 4)
                hum = max(10, min(100, np.random.normal(70.0, 10)))
                rain = max(100, np.random.normal(800.0, 200))
                X_synth.append([n, p, k, temp, hum, ph, rain])
                y_synth.append(crop)
                
        self.model = RandomForestClassifier(n_estimators=20, random_state=42)
        self.model.fit(X_synth, y_synth)
        self.classes_ = self.model.classes_

    def predict_probabilities(self, n, p, k, ph, temp, hum, rain):
        """
        Classifies input NPK/weather vectors and returns sorted list of matching crop names and probabilities.
        """
        feature_vector = [[n, p, k, temp, hum, ph, rain]]
        
        probs = self.model.predict_proba(feature_vector)[0]
        results = []
        for idx, p_val in enumerate(probs):
            raw_label = self.classes_[idx]
            clean_name = self.CROP_MAP_CLEAN.get(raw_label, raw_label.capitalize())
            results.append({
                "crop": clean_name,
                "score": int(p_val * 100)
            })
            
        results.sort(key=lambda x: x['score'], reverse=True)
        return results

# Global model instance
crop_rec_model = CropModel()
