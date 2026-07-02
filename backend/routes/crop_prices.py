from flask import Blueprint, request, jsonify
from services.crop_price_service import CropPriceService
from utils.cache import mandi_cache
from utils.validators import Validators

crop_prices_bp = Blueprint('crop_prices', __name__)

@crop_prices_bp.route('', methods=['GET'])
def get_crop_prices():
    # Sanitize and validate inputs
    commodity = Validators.sanitize_text(request.args.get('commodity'))
    state = Validators.sanitize_text(request.args.get('state'))
    district = Validators.sanitize_text(request.args.get('district'))
    market = Validators.sanitize_text(request.args.get('market'))
    date = Validators.validate_date(request.args.get('date'))
    
    page = request.args.get('page', 1)
    limit = request.args.get('limit', 25)
    
    clean_page, clean_limit = Validators.validate_page_params(page, limit)
    
    # Build cache key based on query parameters
    cache_key = f"prices_{commodity}_{state}_{district}_{market}_{date}_{clean_page}_{clean_limit}"
    cached_res = mandi_cache.get(cache_key)
    if cached_res:
        return jsonify(cached_res), 200

    try:
        # Fetch from service
        result = CropPriceService.get_prices(
            commodity=commodity,
            state=state,
            district=district,
            market=market,
            date=date,
            page=clean_page,
            limit=clean_limit
        )
        
        # Save to cache for 5 minutes (300 seconds)
        if result.get('success'):
            mandi_cache.set(cache_key, result, timeout=300)
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to retrieve crop prices: {str(e)}"}), 500

@crop_prices_bp.route('/commodities', methods=['GET'])
def get_commodities():
    cache_key = "mandi_commodities"
    cached = mandi_cache.get(cache_key)
    if cached:
        return jsonify({"success": True, "data": cached}), 200
        
    try:
        data = CropPriceService.get_commodities()
        mandi_cache.set(cache_key, data, timeout=600) # cache commodities longer
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@crop_prices_bp.route('/states', methods=['GET'])
def get_states():
    cache_key = "mandi_states"
    cached = mandi_cache.get(cache_key)
    if cached:
        return jsonify({"success": True, "data": cached}), 200
        
    try:
        data = CropPriceService.get_states()
        mandi_cache.set(cache_key, data, timeout=600)
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@crop_prices_bp.route('/districts', methods=['GET'])
def get_districts():
    state = Validators.sanitize_text(request.args.get('state'))
    if not state:
        return jsonify({"success": False, "error": "state parameter is required"}), 400
        
    cache_key = f"mandi_districts_{state}"
    cached = mandi_cache.get(cache_key)
    if cached:
        return jsonify({"success": True, "data": cached}), 200
        
    try:
        data = CropPriceService.get_districts(state)
        mandi_cache.set(cache_key, data, timeout=300)
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@crop_prices_bp.route('/markets', methods=['GET'])
def get_markets():
    district = Validators.sanitize_text(request.args.get('district'))
    if not district:
        return jsonify({"success": False, "error": "district parameter is required"}), 400
        
    cache_key = f"mandi_markets_{district}"
    cached = mandi_cache.get(cache_key)
    if cached:
        return jsonify({"success": True, "data": cached}), 200
        
    try:
        data = CropPriceService.get_markets(district)
        mandi_cache.set(cache_key, data, timeout=300)
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@crop_prices_bp.route('/search', methods=['GET'])
def search_prices():
    query = Validators.sanitize_text(request.args.get('q', ''))
    if not query:
        return jsonify({"success": False, "error": "Search query 'q' is required"}), 400
        
    # Search mock database for matches across commodity, market, district, state
    try:
        records = CropPriceService.MOCK_RECORDS
        matched = []
        for r in records:
            if (query.lower() in r['commodity'].lower() or 
                query.lower() in r['market'].lower() or 
                query.lower() in r['district'].lower() or 
                query.lower() in r['state'].lower()):
                matched.append(CropPrice.from_api_dict(r).to_dict())
                
        return jsonify({
            "success": True,
            "count": len(matched),
            "data": matched
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@crop_prices_bp.route('/insights', methods=['GET'])
def get_insights():
    district = request.args.get('district', 'Guntur')
    commodity = request.args.get('commodity', '')
    
    # Query mock database or live records to get active prices to send to Gemini
    records = CropPriceService.MOCK_RECORDS
    if district:
        records = [r for r in records if r['district'].lower() == district.lower()]
    if commodity:
        records = [r for r in records if r['commodity'].lower() == commodity.lower()]
        
    prompt = f"""
    Here are the current crop prices in {district} mandi:
    {json.dumps(records[:10])}
    
    Act as an expert agricultural market advisor. Write a brief, 3-sentence summary analyzing these crop prices. 
    State which crops are currently most profitable, any notable pricing changes, and action recommendations for farmers (e.g. holding or selling).
    Do not mention json format or markdown. Keep it encouraging and direct.
    """
    
    from services.gemini_service import GeminiService
    if GeminiService._is_api_available():
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return jsonify({"success": True, "insights": response.text.strip()}), 200
        except Exception as e:
            print(f"Error calling Gemini for insights: {e}")
            
    # Fallback advice
    return jsonify({
        "success": True,
        "insights": f"Tomato and Chilli prices in {district} are showing steady upward trends. Consider selling tomato yields within the next 3 days, as a supply influx is expected to stabilize prices soon. Chilli remains a highly profitable long-term commodity."
    }), 200
