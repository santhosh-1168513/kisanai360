import React, { useState, useEffect } from 'react';
import { 
  Droplet, Info, Compass, RotateCcw, AlertTriangle, CheckCircle, 
  BarChart as LucideBarChart, Sun, Cloud, Thermometer, Wind, Save, Loader2, Smartphone 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { translations } from '../utils/translations';

export default function WaterAdvisory({ currentUser, language }) {
  const t = translations[language] || translations.english;

  // Form parameters state
  const [soilType, setSoilType] = useState('Red Soil');
  const [moisture, setMoisture] = useState(28);
  const [ph, setPh] = useState(6.8);
  const [organicCarbon, setOrganicCarbon] = useState(0.45);

  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Arka Rakshak');
  const [growthStage, setGrowthStage] = useState('Flowering');
  const [farmSize, setFarmSize] = useState(2.5);
  const [irrigationMethod, setIrrigationMethod] = useState('Drip');

  // Meteorological & Advisory states
  const [weather, setWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [trends, setTrends] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({ totalSavedLiters: 0, totalUsedLiters: 0, electricitySavedINR: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  // SMS sending states
  const [smsSent, setSmsSent] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const handleSendSms = async () => {
    if (!advisory) return;
    setIsSendingSms(true);
    try {
      const smsBody = `Water Advisory: ${advisory.status}. Water required: ${advisory.water_required_mm} mm. Duration: ${advisory.estimated_duration_minutes} mins. Best time: ${advisory.recommended_time}. KisanAI 360 Advisory.`;
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          phone: currentUser.phone || '+91 98765 43210',
          title: "Irrigation Advisory",
          message: smsBody
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsSent(true);
        alert(`SMS irrigation advisory successfully sent to ${currentUser.phone || '+91 98765 43210'}!`);
      } else {
        alert(data.error || "Failed to dispatch SMS alert.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingSms(false);
    }
  };

  // Fetch initial advisory and weather data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current weather and forecast
      const weatherRes = await fetch(`/api/weather?latitude=16.3067&longitude=80.4365`);
      const weatherData = await weatherRes.json();
      if (weatherData.success) {
        setWeather(weatherData.weather);
      }

      // 2. Fetch current soil config
      const soilRes = await fetch(`/api/soil?userId=${currentUser.userId}`);
      const soilData = await soilRes.json();
      if (soilData.success && soilData.soil) {
        setSoilType(soilData.soil.soilType);
        setMoisture(soilData.soil.moisture);
        setPh(soilData.soil.ph);
        setOrganicCarbon(soilData.soil.organicCarbon || 0.45);
      }

      // 3. Fetch trends, usage data
      const usageRes = await fetch(`/api/water-usage?userId=${currentUser.userId}`);
      const usageData = await usageRes.json();
      if (usageData.success) {
        setTrends(usageData.trends);
        setMetrics(usageData.metrics);
      }

      // 4. Fetch irrigation run history list
      const histRes = await fetch(`/api/irrigation-history?userId=${currentUser.userId}`);
      const histData = await histRes.json();
      if (histData.success) {
        setHistory(histData.history);
      }

      // 5. Query active water recommendation advisory
      const advisoryRes = await fetch('/api/water-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          latitude: 16.3067,
          longitude: 80.4365,
          moisture: moisture,
          cropName: cropName,
          growthStage: growthStage,
          irrigationMethod: irrigationMethod,
          farmSize: farmSize
        })
      });
      const advisoryData = await advisoryRes.json();
      if (advisoryData.success) {
        setAdvisory(advisoryData.advisory);
      }
    } catch (err) {
      console.error("Error loading water advisory:", err);
    } finally {
      setLoading(false);
    }
  };

  // Submit parameter adjustments
  const handleUpdateAdvisory = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch('/api/water-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          latitude: 16.3067,
          longitude: 80.4365,
          soilType,
          moisture,
          ph,
          organicCarbon,
          cropName,
          variety,
          growthStage,
          farmSize,
          irrigationMethod
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdvisory(data.advisory);
        
        // Refresh usage charts and trends
        const usageRes = await fetch(`/api/water-usage?userId=${currentUser.userId}`);
        const usageData = await usageRes.json();
        if (usageData.success) {
          setTrends(usageData.trends);
          setMetrics(usageData.metrics);
        }
      } else {
        alert(data.error || "Failed to update advisory.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting advisory server.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs text-gray-400">Loading live weather forecasts and soil sensor metrics...</p>
      </div>
    );
  }

  // Get color configurations for advisory status cards
  const getStatusStyle = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s.includes('postpone')) {
      return {
        bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-400",
        badge: "bg-blue-500 text-white",
        icon: <Cloud className="w-6 h-6 text-blue-500 shrink-0" />
      };
    } else if (s.includes('irrigate')) {
      return {
        bg: "bg-danger/5 dark:bg-danger/10 border-danger/10 dark:border-danger/30 text-danger",
        badge: "bg-danger text-white animate-pulse",
        icon: <AlertTriangle className="w-6 h-6 text-danger shrink-0 animate-bounce" />
      };
    } else {
      return {
        bg: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-800 dark:text-emerald-400",
        badge: "bg-emerald-500 text-white",
        icon: <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
      };
    }
  };

  const statusStyle = getStatusStyle(advisory?.status);

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
          AI Smart Water Advisory & Irrigation 🌾
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Intelligent crop watering suggestions mapping real-time Open-Meteo forecasts, NPK/soil attributes, and crop evapotranspiration coefficients.
        </p>
      </div>

      {/* Grid: Main Dashboard & Form Config */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns (Takes 2/3 width) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Top Panel: Weather Forecast & Current advisory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Active Suggestion Banner */}
            <div className={`border rounded-3xl p-6 shadow-md flex flex-col justify-between ${statusStyle.bg}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-full shadow-md">
                    {statusStyle.icon}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Today's Suggestion</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${statusStyle.badge}`}>
                      {advisory?.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSendSms}
                  disabled={isSendingSms || smsSent}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border shadow transition ${
                    smsSent 
                      ? 'bg-emerald-500 text-white cursor-default border-transparent' 
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50'
                  }`}
                >
                  {isSendingSms ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5" />
                  )}
                  <span>{smsSent ? 'SMS Sent ✓' : 'Send via SMS'}</span>
                </button>
              </div>

              <div className="my-4">
                <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold italic">
                  "{advisory?.explanation}"
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-slate-800/80 pt-4 text-center">
                <div>
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">Water Required</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white block mt-0.5">{advisory?.water_required_mm} mm</span>
                </div>
                <div>
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">Est. Duration</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white block mt-0.5">{advisory?.estimated_duration_minutes} min</span>
                </div>
                <div>
                  <span className="text-[8px] text-gray-400 uppercase font-bold block">Best Time</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white block mt-0.5">{advisory?.recommended_time}</span>
                </div>
              </div>
            </div>

            {/* Current Open-Meteo Weather */}
            {weather && (
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Live Open-Meteo Weather</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">Tenali, Guntur</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary dark:text-secondary">{weather.temperature}°C</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-gray-500 dark:text-slate-400">Humidity: <strong className="text-gray-800 dark:text-slate-200">{weather.humidity}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-gray-500 dark:text-slate-400">Wind: <strong className="text-gray-800 dark:text-slate-200">{weather.windSpeed} km/h</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-gray-500 dark:text-slate-400">UV Index: <strong className="text-gray-800 dark:text-slate-200">{weather.uvIndex}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-gray-500 dark:text-slate-400">Cloud Cover: <strong className="text-gray-800 dark:text-slate-200">{weather.cloudCover}%</strong></span>
                  </div>
                </div>

                <div className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-400 leading-normal">
                  📢 <strong>UV & cloud cover advisory:</strong> Solar evaporation rates are moderate. Standard irrigation coefficients apply.
                </div>
              </div>
            )}

          </div>

          {/* Recharts Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Soil Moisture Trend */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4 font-poppins">
                Soil Moisture Sensor Trend (%)
              </h3>
              <div className="h-48">
                {trends?.soilMoisture && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends.soilMoisture}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="moisture" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Weekly Forecast Rainfall */}
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4 font-poppins">
                Weekly Rainfall Forecast (mm)
              </h3>
              <div className="h-48">
                {weather?.forecast && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weather.forecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="rainSum" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Expected Rain (mm)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Water Savings & Consumption Trends */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4 font-poppins">
              Water Consumption vs Savings Trend (Liters)
            </h3>
            <div className="h-56">
              {trends && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends.waterSavings}>
                    <defs>
                      <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#94A3B8" />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area type="monotone" dataKey="saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" name="Water Saved (L)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Weekly Irrigation Forecast Schedule */}
          {weather?.forecast && (
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-4 font-poppins">
                Weekly Meteorological Irrigation Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold">
                      <th className="py-2.5">Day</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-center">Temp Range</th>
                      <th className="py-2.5 text-center">Rain Probability</th>
                      <th className="py-2.5 text-center">Rain Amount</th>
                      <th className="py-2.5 text-right">Advisory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
                    {weather.forecast.map((f, idx) => {
                      const willRain = f.rainSum > 1.0;
                      return (
                        <tr key={idx} className="text-gray-700 dark:text-slate-350">
                          <td className="py-3.5 font-bold">{f.day}</td>
                          <td className="py-3.5 text-gray-400">{f.date}</td>
                          <td className="py-3.5 text-center">{f.tempMin}°C - {f.tempMax}°C</td>
                          <td className="py-3.5 text-center text-blue-500 font-semibold">{f.rainProb}%</td>
                          <td className="py-3.5 text-center font-mono font-bold">{f.rainSum} mm</td>
                          <td className="py-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              willRain 
                                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                            }`}>
                              {willRain ? 'Postpone Irrigation' : 'Normal / Skip'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Parameters Input Forms & Alerts (Takes 1/3 width) */}
        <div className="flex flex-col gap-8">
          
          {/* Active stats metrics */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider font-poppins">
              Acreage Water Efficiency
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-poppins">
                    {metrics.totalSavedLiters.toLocaleString()} Liters
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Total saved water this season</span>
                </div>
                <div className="p-2.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
                  <Droplet className="w-5 h-5" />
                </div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-poppins">
                    ₹{metrics.electricitySavedINR.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Estimated Electricity Bills Saved</span>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                  <Compass className="w-5 h-5" />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-poppins">
                    {metrics.totalUsedLiters.toLocaleString()} Liters
                  </span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Irrigation applied volume</span>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                  <LucideBarChart className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Form input fields */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Update Field Parameters</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Modify soil metrics and growth stage to adjust rules.</p>
            </div>

            <form onSubmit={handleUpdateAdvisory} className="flex flex-col gap-4">
              
              {/* Soil Moisture */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Soil Moisture (%)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={moisture}
                    onChange={(e) => setMoisture(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-150 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary dark:accent-secondary"
                  />
                  <span className="text-xs font-bold font-mono dark:text-white w-8 text-right">{moisture}%</span>
                </div>
              </div>

              {/* Soil Type & pH */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  >
                    <option value="Red Soil">Red Soil</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                    <option value="Clayey Soil">Clayey Soil</option>
                    <option value="Loamy Soil">Loamy Soil</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value))}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  />
                </div>
              </div>

              {/* Crop & Growth stage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Crop Name</label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Growth Stage</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative">Vegetative</option>
                    <option value="Flowering">Flowering</option>
                    <option value="Fruiting">Fruiting</option>
                    <option value="Harvest">Harvest</option>
                  </select>
                </div>
              </div>

              {/* Farm Size & Irrigation Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Farm Size (Acre)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={farmSize}
                    onChange={(e) => setFarmSize(parseFloat(e.target.value))}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Method</label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                  >
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Flood">Flood</option>
                  </select>
                </div>
              </div>

              {/* Organic Carbon */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Organic Carbon (%) (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={organicCarbon}
                  onChange={(e) => setOrganicCarbon(parseFloat(e.target.value))}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/55 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs font-poppins mt-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span>Recalculating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-accent" />
                    <span>Update & Diagnose</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Alerts panel */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider font-poppins">
              Irrigation Safety Notifications
            </h3>
            <div className="flex flex-col gap-3">
              {moisture < 30 && (
                <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl text-xs text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-bold block">Critically Low Soil Moisture</span>
                    <span className="text-[10px] text-red-500/80 mt-0.5 block">Soil moisture is below 30%. Water crops within 6 hours.</span>
                  </div>
                </div>
              )}
              {weather?.uvIndex > 6.0 && (
                <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl text-xs text-amber-700 dark:text-amber-400">
                  <Sun className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-bold block">High Evaporation Warning</span>
                    <span className="text-[10px] text-amber-500/80 mt-0.5 block">High UV Index ({weather.uvIndex}). Irrigate only during early morning or evening.</span>
                  </div>
                </div>
              )}
              {weather?.forecast[2]?.rainSum > 5.0 && (
                <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-xs text-blue-700 dark:text-blue-400">
                  <Cloud className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-bold block">Heavy Rainfall expected soon</span>
                    <span className="text-[10px] text-blue-500/80 mt-0.5 block">Sum {weather.forecast[2].rainSum}mm expected on {weather.forecast[2].day}. Postpone fertilizing.</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block">Drip Irrigation saving active</span>
                  <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Drip method is saving roughly 30% water relative to flood irrigation.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
