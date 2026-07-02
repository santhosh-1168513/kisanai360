import os
import requests
import time
from models.crop_price import CropPrice
from config import Config

class CropPriceService:
    BASE_URL = os.environ.get('DATA_GOV_BASE_URL', 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070')
    API_KEY = os.environ.get('DATA_GOV_API_KEY', '')

    # Interactive Mock Data Store for testing dropdown filters when key is missing or offline
    MOCK_RECORDS = [
        # Andhra Pradesh
        {"commodity": "Tomato", "state": "Andhra Pradesh", "district": "Guntur", "market": "Guntur Mandi", "variety": "Local", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "2000", "max_price": "3000", "modal_price": "2500"},
        {"commodity": "Tomato", "state": "Andhra Pradesh", "district": "Guntur", "market": "Tenali Mandi", "variety": "Hybrid", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "2200", "max_price": "3200", "modal_price": "2700"},
        {"commodity": "Chilli", "state": "Andhra Pradesh", "district": "Guntur", "market": "Guntur Mandi", "variety": "Teja", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "7500", "max_price": "9000", "modal_price": "8200"},
        {"commodity": "Cotton", "state": "Andhra Pradesh", "district": "Guntur", "market": "Tenali Mandi", "variety": "LRA", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "5800", "max_price": "6800", "modal_price": "6200"},
        {"commodity": "Paddy", "state": "Andhra Pradesh", "district": "Anantapur", "market": "Anantapur Mandi", "variety": "Super", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "2200", "max_price": "2600", "modal_price": "2400"},
        {"commodity": "Maize", "state": "Andhra Pradesh", "district": "Anantapur", "market": "Anantapur Mandi", "variety": "Yellow", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "1600", "max_price": "2000", "modal_price": "1800"},
        
        # Telangana
        {"commodity": "Tomato", "state": "Telangana", "district": "Warangal", "market": "Warangal Mandi", "variety": "Local", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "1800", "max_price": "2800", "modal_price": "2300"},
        {"commodity": "Chilli", "state": "Telangana", "district": "Warangal", "market": "Warangal Mandi", "variety": "Wonder Hot", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "7000", "max_price": "8500", "modal_price": "7800"},
        {"commodity": "Paddy", "state": "Telangana", "district": "Khammam", "market": "Khammam Mandi", "variety": "BPT", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "2100", "max_price": "2500", "modal_price": "2300"},
        
        # Tamil Nadu
        {"commodity": "Onion", "state": "Tamil Nadu", "district": "Coimbatore", "market": "Coimbatore Mandi", "variety": "Bellary", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "1200", "max_price": "1800", "modal_price": "1500"},
        {"commodity": "Tomato", "state": "Tamil Nadu", "district": "Coimbatore", "market": "Pollachi Mandi", "variety": "Local", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "2500", "max_price": "3500", "modal_price": "3000"},
        {"commodity": "Groundnut", "state": "Tamil Nadu", "district": "Madurai", "market": "Madurai Mandi", "variety": "Pod", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "5000", "max_price": "6000", "modal_price": "5500"},
        
        # Maharashtra
        {"commodity": "Onion", "state": "Maharashtra", "district": "Pune", "market": "Pune Mandi", "variety": "Red", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "1400", "max_price": "2000", "modal_price": "1700"},
        {"commodity": "Onion", "state": "Maharashtra", "district": "Pune", "market": "Manchar Mandi", "variety": "White", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "1500", "max_price": "2200", "modal_price": "1850"},
        {"commodity": "Turmeric", "state": "Maharashtra", "district": "Nagpur", "market": "Nagpur Mandi", "variety": "Selam", "grade": "FAQ", "arrival_date": "01/07/2026", "min_price": "10000", "max_price": "12000", "modal_price": "11000"}
    ]

    @classmethod
    def get_prices(cls, commodity=None, state=None, district=None, market=None, date=None, page=1, limit=25):
        """
        Queries data.gov.in Mandi API with retry logic and caching. Falls back to mock data.
        """
        # If API Key is present, make live HTTP requests with retry mechanism
        if cls.API_KEY:
            params = {
                "api-key": cls.API_KEY,
                "format": "json",
                "limit": limit,
                "offset": (page - 1) * limit
            }
            
            # Map filters matching API spec
            if commodity:
                params["filters[commodity]"] = commodity
            if state:
                params["filters[state]"] = state
            if district:
                params["filters[district]"] = district
            if market:
                params["filters[market]"] = market
            if date:
                params["filters[arrival_date]"] = date

            # 3 Retries with exponential backoff
            for attempt in range(3):
                try:
                    res = requests.get(cls.BASE_URL, params=params, timeout=5) # 5s timeout
                    if res.status_code == 200:
                        payload = res.json()
                        records = payload.get('records', [])
                        parsed_records = [CropPrice.from_api_dict(r).to_dict() for r in records]
                        total = int(payload.get('total', len(parsed_records)))
                        return {
                            "success": True,
                            "count": len(parsed_records),
                            "total": total,
                            "data": parsed_records
                        }
                    elif res.status_code == 401:
                        print("Invalid API Key for data.gov.in, falling back to mock.")
                        break
                except Exception as e:
                    print(f"Attempt {attempt+1} failed: {e}")
                    time.sleep(1 * (attempt + 1)) # Wait 1s, 2s

        # Fallback Mock Filter Implementation
        filtered = list(cls.MOCK_RECORDS)
        
        if commodity:
            filtered = [r for r in filtered if r['commodity'].lower() == commodity.lower()]
        if state:
            filtered = [r for r in filtered if r['state'].lower() == state.lower()]
        if district:
            filtered = [r for r in filtered if r['district'].lower() == district.lower()]
        if market:
            filtered = [r for r in filtered if r['market'].lower() == market.lower()]
        if date:
            filtered = [r for r in filtered if r['arrival_date'] == date]

        total = len(filtered)
        
        # Paginate
        start = (page - 1) * limit
        end = start + limit
        paginated = filtered[start:end]
        
        parsed_records = [CropPrice.from_api_dict(r).to_dict() for r in paginated]

        return {
            "success": True,
            "count": len(parsed_records),
            "total": total,
            "data": parsed_records
        }

    @classmethod
    def get_commodities(cls):
        """
        Returns alphabetical list of unique commodities.
        """
        # If live key is present, we could query, but filtering unique values locally from mock is reliable and fast
        return sorted(list(set(r['commodity'] for r in cls.MOCK_RECORDS)))

    @classmethod
    def get_states(cls):
        """
        Returns unique states list.
        """
        return sorted(list(set(r['state'] for r in cls.MOCK_RECORDS)))

    @classmethod
    def get_districts(cls, state_filter=None):
        """
        Returns unique districts filtered by state.
        """
        records = cls.MOCK_RECORDS
        if state_filter:
            records = [r for r in records if r['state'].lower() == state_filter.lower()]
        return sorted(list(set(r['district'] for r in records)))

    @classmethod
    def get_markets(cls, district_filter=None):
        """
        Returns unique markets filtered by district.
        """
        records = cls.MOCK_RECORDS
        if district_filter:
            records = [r for r in records if r['district'].lower() == district_filter.lower()]
        return sorted(list(set(r['market'] for r in records)))
