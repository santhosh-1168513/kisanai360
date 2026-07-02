import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  HelpCircle, 
  FileText, 
  Check, 
  Loader2, 
  Sparkles, 
  Compass, 
  Droplet, 
  TrendingUp, 
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import confetti from 'canvas-confetti';

export default function CropRecommendation({ currentUser, language }) {
  // Input Form States
  const [state, setState] = useState(currentUser?.state || 'Andhra Pradesh');
  const [district, setDistrict] = useState(currentUser?.district || 'Guntur');
  const [soilType, setSoilType] = useState('Red');
  const [ph, setPh] = useState('6.5');
  const [groundwaterDepth, setGroundwaterDepth] = useState('45');
  const [nitrogen, setNitrogen] = useState('80');
  const [phosphorus, setPhosphorus] = useState('45');
  const [potassium, setPotassium] = useState('40');
  const [temperature, setTemperature] = useState('26');
  const [humidity, setHumidity] = useState('70');
  const [rainfall, setRainfall] = useState('800');
  const [season, setSeason] = useState('Kharif');
  const [farmSize, setFarmSize] = useState(currentUser?.farmSize || '2.5');
  const [water, setWater] = useState('Medium');

  // SMS sending states
  const [smsSent, setSmsSent] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const handleSendSms = async () => {
    if (!recommendations || !recommendations[0]) return;
    setIsSendingSms(true);
    try {
      const topCrop = recommendations[0];
      const smsBody = `Crop Suitability Recommendation: ${topCrop.crop} (${topCrop.score}% Match). Sowing: ${topCrop.sowing_period}. Est. Profit: ₹${topCrop.estimated_profit.toLocaleString()}. KisanAI 360 Advisory.`;
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          phone: currentUser.phone || '+91 98765 43210',
          title: "Crop Recommendation",
          message: smsBody
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsSent(true);
        alert(`SMS recommendation alert successfully sent to ${currentUser.phone || '+91 98765 43210'}!`);
      } else {
        alert(data.error || "Failed to dispatch SMS alert.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingSms(false);
    }
  };

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-detect GPS coordinates and fetch live local weather params
  const handleDetectWeather = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch live weather data from our geolocated dashboard endpoint
          const res = await fetch(`/api/weather/dashboard?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.success && data.weather) {
            setTemperature(data.weather.temperature.toString());
            setHumidity(data.weather.humidity?.toString() || '68');
            setRainfall(data.weather.rainfall?.toString() || '800');
            
            // Auto update state/district if reverse geocoding solved them
            if (data.weather.location) {
              const parts = data.weather.location.split(',');
              if (parts[0]) setDistrict(parts[0].trim());
              if (parts[1]) setState(parts[1].trim());
            }
          }
        } catch (e) {
          console.error("Error fetching live GPS weather:", e);
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.warn("GPS access denied:", err);
        setIsDetecting(false);
      }
    );
  };

  // Submit form to crop recommendation engine
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRecommendations(null);
    setAiInsights('');
    setIsSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/recommend-crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.userId || 'anonymous',
          state,
          district,
          soil_type: soilType,
          ph: parseFloat(ph) || 6.5,
          groundwater_depth: parseFloat(groundwaterDepth) || 45.0,
          nitrogen: parseInt(nitrogen) || 80,
          phosphorus: parseInt(phosphorus) || 45,
          potassium: int(potassium) || 40,
          temperature: parseFloat(temperature) || 26.0,
          humidity: parseFloat(humidity) || 70.0,
          rainfall: parseFloat(rainfall) || 800.0,
          season,
          farm_size: parseFloat(farmSize) || 2.5,
          water
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setRecommendations(data.recommendations);
        
        // Trigger celebratory confetti on a successful AI crop matches
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setError(data.error || "Failed to generate recommendation.");
      }
    } catch (err) {
      console.error(err);
      setError("Error communicating with recommendation engine. Is Flask active?");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI insights for the top crop
  const fetchAiAdvisory = async (cropName) => {
    setIsAiLoading(true);
    setAiInsights('');
    try {
      const res = await fetch(`/api/crops/insights?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(cropName)}`);
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (recommendations && recommendations[0]) {
      fetchAiAdvisory(recommendations[0].crop);
    }
  }, [recommendations]);

  // Convert potassium/npk values to integer
  function int(val) {
    return parseInt(val) || 40;
  }

  // Visualizing Charts Data
  const suitabilityChartData = recommendations ? recommendations.map(r => ({
    name: r.crop,
    "Suitability Score (%)": r.score,
    "Market Price (₹/kg)": r.market_price
  })) : [];

  const profitChartData = recommendations ? recommendations.map(r => ({
    name: r.crop,
    "Projected Profit (₹)": r.estimated_profit
  })) : [];

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins flex items-center gap-2">
          AI Crop Recommendation Engine 🌾
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Machine Learning Random Forest model recommending optimal seasonal crop matches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Inputs Panel (Takes 2/5 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-850 pb-2">
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase">Soil & Climate Inputs</span>
              <button
                type="button"
                onClick={handleDetectWeather}
                disabled={isDetecting}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
              >
                <Compass className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Locating...' : 'Detect GPS & Weather'}</span>
              </button>
            </div>

            {/* Location (State/District) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-450 uppercase">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-450 uppercase">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* Soil Type, pH & Groundwater Depth */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-455 uppercase">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
                >
                  <option value="Red">Red Soil</option>
                  <option value="Black">Black Cotton</option>
                  <option value="Clay">Clayey Soil</option>
                  <option value="Sandy">Sandy Loam</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-455 uppercase">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-455 uppercase">Groundwater (m)</label>
                <input
                  type="number"
                  value={groundwaterDepth}
                  onChange={(e) => setGroundwaterDepth(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* NPK Values */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-450 uppercase">Nitrogen (N)</label>
                <input
                  type="number"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-450 uppercase">Phosphorus (P)</label>
                <input
                  type="number"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-455 uppercase">Potassium (K)</label>
                <input
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* Climate Factors (Temp, Humidity, Rain) */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-450 uppercase">Temp (°C)</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-455 uppercase">Humidity (%)</label>
                <input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-gray-455 uppercase">Rainfall (mm)</label>
                <input
                  type="number"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* Season, Water source & Size */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-450 uppercase">Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                >
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-455 uppercase">Water Access</label>
                <select
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-gray-455 uppercase">Farm Acres</label>
                <input
                  type="number"
                  step="0.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-danger/5 border border-danger/10 text-danger rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/55 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs font-poppins mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fitting Random Forest Weights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  <span>Get ML Crop Suitability</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Output Panels (Takes 3/5 width) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {recommendations ? (
            <div className="flex flex-col gap-8 animate-float">
              
              {/* Gemini AI Summary Banner */}
              {aiInsights && (
                <div className="bg-gradient-to-r from-primary/5 to-accent/15 border border-primary/10 rounded-3xl p-5 shadow-sm text-left flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-primary dark:text-secondary uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" /> Gemini AI Market Insights
                    </span>
                    <button
                      onClick={handleSendSms}
                      disabled={isSendingSms || smsSent}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
                        smsSent 
                          ? 'bg-emerald-500 text-white cursor-default' 
                          : 'bg-primary hover:bg-primary-dark text-white'
                      }`}
                    >
                      {isSendingSms ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Smartphone className="w-2.5 h-2.5" />
                      )}
                      <span>{smsSent ? 'SMS Sent ✓' : 'Send via SMS'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold">
                    {aiInsights}
                  </p>
                </div>
              )}

              {/* Top 5 Recommendation list cards */}
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Top 5 Recommended Crops</h3>
                <div className="flex flex-col gap-3">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={rec.crop}
                      className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover-card-lift flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          #{index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-extrabold text-gray-900 dark:text-white font-poppins">{rec.crop}</span>
                          <span className="text-[10px] text-gray-400">Duration: {rec.duration} | Sowing: {rec.sowing_period}</span>
                          <ul className="flex flex-col gap-0.5 mt-2">
                            {rec.reasons.map((r, i) => (
                              <li key={i} className="text-[9px] text-gray-500 flex items-center gap-1">
                                <span className="h-1 w-1 bg-primary rounded-full shrink-0" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Metric scores */}
                      <div className="flex sm:flex-col items-end gap-4 sm:gap-1 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-50 pt-2 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase">Match Score</span>
                          <span className="bg-primary/10 text-primary dark:text-secondary text-xs font-black px-2 py-0.5 rounded-full">
                            {rec.score}%
                          </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-500">Est. Profit: ₹{rec.estimated_profit.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400">Mandi Price: ₹{rec.market_price}/kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visualizations (Recharts Bar chart) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                  <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200 mb-4 font-poppins">Suitability Scores comparison</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={suitabilityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Suitability Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                  <h4 className="font-bold text-xs text-gray-800 dark:text-slate-200 mb-4 font-poppins">Expected Profit (₹)</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                        <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Projected Profit (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-16 shadow-sm flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="bg-primary/5 p-4 rounded-full">
                <Sprout className="w-12 h-12 text-primary/40 dark:text-secondary/40 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Ready for AI suitability prediction</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Configure your crop season and NPK values on the left or click 'Detect GPS' to fetch local meteorological stats automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
