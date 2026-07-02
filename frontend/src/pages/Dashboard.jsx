import React, { useState, useEffect, useRef } from 'react';
import { 
  CloudSun, 
  Activity, 
  Droplet, 
  TrendingUp, 
  AlertTriangle, 
  Map, 
  ArrowRight,
  TrendingDown,
  Layers,
  Locate
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { translations } from '../utils/translations';

export default function Dashboard({ currentUser, setView, language }) {
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [ndviMode, setNdviMode] = useState('satellite'); // satellite, ndvi, moisture
  const [isLoading, setIsLoading] = useState(true);
  const [marketPrices, setMarketPrices] = useState(null);
  const shownPushAlerts = useRef(new Set());
  const t = translations[language] || translations.english;

  useEffect(() => {
    async function fetchDashboardData(latitude, longitude) {
      setIsLoading(true);
      try {
        let url = `/api/weather/dashboard`;
        if (latitude && longitude) {
          url += `?lat=${latitude}&lon=${longitude}`;
        } else if (currentUser.district) {
          url += `?location=${currentUser.district}, ${currentUser.village || ''}`;
        }
        
        // Fetch weather
        const weatherRes = await fetch(url);
        const weatherData = await weatherRes.json();
        if (weatherData.success) {
          setWeather(weatherData.weather);
          
          // Determine district for crop prices
          const parts = weatherData.weather.location.split(',');
          const districtName = parts[1]?.trim() || parts[0]?.trim() || 'Guntur';
          fetchPrices(districtName);
        }

        // Fetch alerts
        const alertsRes = await fetch(`/api/weather/alerts?userId=${currentUser.userId}`);
        const alertsData = await alertsRes.json();
        if (alertsData.success) {
          setAlerts(alertsData.alerts);
          
          // Trigger HTML5 push notifications for high level alerts
          if ("Notification" in window) {
            if (Notification.permission === "default") {
              Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              alertsData.alerts.forEach(alert => {
                if (alert.level === 'high' && !shownPushAlerts.current.has(alert.id)) {
                  shownPushAlerts.current.add(alert.id);
                  new Notification(alert.title, {
                    body: alert.message,
                    icon: '/favicon.ico'
                  });
                }
              });
            }
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchPrices(district) {
      try {
        const res = await fetch(`/api/crops/prices?district=${district}`);
        const data = await res.json();
        if (data.success) {
          setMarketPrices(data.prices);
        }
      } catch (e) {
        console.error("Prices fetch error:", e);
      }
    }

    // Attempt to request browser GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchDashboardData(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation denied or unavailable, utilizing profile defaults:", error);
          fetchDashboardData();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Mock Recharts chart data - weekly rainfall and soil moisture
  const chartData = [
    { day: 'Mon', Rainfall: 2.0, Moisture: 68 },
    { day: 'Tue', Rainfall: 15.2, Moisture: 82 },
    { day: 'Wed', Rainfall: 8.5, Moisture: 78 },
    { day: 'Thu', Rainfall: 0.0, Moisture: 72 },
    { day: 'Fri', Rainfall: 0.0, Moisture: 65 },
    { day: 'Sat', Rainfall: 1.2, Moisture: 60 },
    { day: 'Sun', Rainfall: 0.0, Moisture: 58 }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-xs text-gray-400">Loading your farm dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
            {t.goodMorning}, {currentUser.name} 🌾
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Here is what is happening in your farm at {weather?.location || `${currentUser.village || 'Tenali'}, ${currentUser.district || 'Guntur'}`} today.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
          <Locate className="w-4 h-4 animate-pulse" />
          <span>Farm Located: {currentUser.farmSize || '2.5'} Acres</span>
        </div>
      </div>

      {/* Grid of status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weather card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-card-lift relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-gray-900 dark:text-white font-poppins">
                {weather?.temperature}°C
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                {weather?.condition}
              </span>
            </div>
            <CloudSun className="w-10 h-10 text-amber-500 animate-float" />
          </div>
          <div className="border-t border-gray-50 dark:border-slate-800/60 pt-3 mt-4 text-[10px] text-gray-650 dark:text-slate-350">
            <span className="font-semibold text-primary dark:text-secondary block truncate">
              {weather?.aiAdvisory?.irrigationAdvice || "Standard moisture levels."}
            </span>
          </div>
        </div>

        {/* Crop health card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-card-lift relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-450 dark:text-slate-450 uppercase">Crop Status</span>
              <span className="text-base font-extrabold text-primary dark:text-secondary mt-1 font-poppins">
                Tomato - Good
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Last Scan: Today, 9:30 AM</span>
            </div>
            <Activity className="w-8 h-8 text-emerald-500 animate-pulse-slow" />
          </div>
          <button 
            onClick={() => setView('disease-det')} 
            className="w-full flex items-center justify-between text-[10px] text-primary dark:text-secondary font-bold hover:underline border-t border-gray-50 dark:border-slate-800/60 pt-3 mt-4"
          >
            <span>Scan crop health</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Water advisory card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-card-lift relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-450 dark:text-slate-450 uppercase">Soil Moisture</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-poppins">
                {weather?.soilMoisture}%
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Optimal Range: 60% - 80%</span>
            </div>
            <Droplet className="w-8 h-8 text-blue-500 animate-bounce" />
          </div>
          <div className="border-t border-gray-50 dark:border-slate-800/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-gray-650 dark:text-slate-350">
            <span className="font-semibold text-blue-600 dark:text-blue-400">420L Saved this week</span>
            <button onClick={() => setView('water')} className="text-primary hover:underline font-bold">
              Details
            </button>
          </div>
        </div>

        {/* Market prices card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover-card-lift relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col w-full text-left font-inter">
              <span className="text-xs font-bold text-gray-455 dark:text-slate-455 uppercase">{t.marketPrice}</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                {marketPrices ? (
                  Object.keys(marketPrices).map((cropKey) => {
                    const info = marketPrices[cropKey];
                    const isUp = info.change.startsWith('+');
                    return (
                      <div key={cropKey} className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-slate-300 border-b border-gray-50/50 dark:border-slate-850 pb-0.5 last:border-b-0">
                        <span className="capitalize text-[10px] truncate pr-1">{cropKey}</span>
                        <span className={`flex items-center font-extrabold text-[10px] shrink-0 gap-0.5 ${isUp ? 'text-emerald-500' : 'text-danger'}`}>
                          {info.price} {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span className="text-[8px] font-medium opacity-80 ml-0.5">({info.change})</span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-gray-400 col-span-2">Loading live prices...</div>
                )}
              </div>
            </div>
          </div>
          <span className="text-[9px] text-gray-455 border-t border-gray-55 dark:border-slate-800/60 pt-2 block truncate mt-2">
            Mandi: {weather?.location?.split(',')[1]?.trim() || "Guntur"} Market
          </span>
        </div>
      </div>

      {/* Main double column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 columns: Charts, satellite map */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Recharts chart */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-4 font-poppins">
              Soil Moisture & Rainfall Chart
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="Moisture" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMoisture)" strokeWidth={2} name="Moisture (%)" />
                  <Area type="monotone" dataKey="Rainfall" stroke="#10b981" fillOpacity={1} fill="url(#colorRain)" strokeWidth={2} name="Rainfall (mm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Farm satellite view mockup */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 font-poppins">
                  Satellite Farm boundary View
                </h3>
                <p className="text-[10px] text-gray-400">Boundary coordinates: Lat {weather?.latitude?.toFixed(4) || 16.3067}, Lon {weather?.longitude?.toFixed(4) || 80.4365}</p>
              </div>
              
              {/* Map layer switcher */}
              <div className="flex gap-1.5 border border-gray-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-850">
                {['satellite', 'ndvi', 'moisture'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setNdviMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                      ndviMode === mode 
                        ? 'bg-primary text-white' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive OpenStreetMap Embed */}
            <div className="relative h-72 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-gray-150 dark:border-slate-850 flex items-center justify-center">
              {weather?.latitude && weather?.longitude ? (
                <div className="absolute inset-0 w-full h-full">
                  <iframe
                    title="Real-time Farm Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${weather.longitude - 0.003}%2C${weather.latitude - 0.003}%2C${weather.longitude + 0.003}%2C${weather.latitude + 0.003}&layer=mapnik&marker=${weather.latitude}%2C${weather.longitude}`}
                    style={{ border: 0 }}
                  />
                  
                  {/* NDVI Overlay */}
                  {ndviMode === 'ndvi' && (
                    <div className="absolute inset-0 bg-emerald-500/25 pointer-events-none mix-blend-color flex items-center justify-center">
                      <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-white shadow-lg border border-slate-700/60 pointer-events-auto">
                        NDVI Vegetation Index: 0.72 (Healthy Crops)
                      </div>
                    </div>
                  )}

                  {/* Soil Moisture Overlay */}
                  {ndviMode === 'moisture' && (
                    <div className="absolute inset-0 bg-blue-500/20 pointer-events-none mix-blend-overlay flex items-center justify-center">
                      <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-white shadow-lg border border-slate-700/60 pointer-events-auto">
                        Soil Moisture Level: {weather.soilMoisture}%
                      </div>
                    </div>
                  )}

                  {/* Satellite Boundary Label */}
                  {ndviMode === 'satellite' && (
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-dashed border-accent pointer-events-none rounded-lg flex items-center justify-center bg-accent/5">
                      <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-bold text-white shadow-lg border border-slate-700/60 pointer-events-auto">
                        {currentUser.name}'s Farm (2.5 Acres)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400">Loading map coordinates...</div>
              )}

              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-2 flex flex-col gap-1 z-10 text-[8px] text-white">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>High Vegetation Index (0.6 - 0.8)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Moderate (0.3 - 0.5)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Bare Soil (0.0 - 0.2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 column: Weather forecast widget, warnings */}
        <div className="flex flex-col gap-8">
          {/* Today's Alerts Panel */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">
                {t.alertsTitle}
              </h3>
              <span className="bg-danger/10 text-danger text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                {alerts.length} Active
              </span>
            </div>

            <div className="flex flex-col gap-4.5">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border text-xs leading-normal flex gap-3 ${
                    alert.level === 'high'
                      ? 'bg-danger/5 border-danger/10 text-danger dark:border-danger/30'
                      : 'bg-warning/5 border-warning/10 text-warning-dark dark:border-warning/30'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <h5 className="font-bold text-xs">{alert.title}</h5>
                    <p className="text-[10px] opacity-85 leading-relaxed">{alert.message}</p>
                    <span className="text-[9px] opacity-60 mt-1 block">SMS Alert sent out</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Advisor Panel */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4">
            <h3 className="font-bold text-sm text-primary dark:text-secondary font-poppins">
              {t.aiSuggestions}
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col bg-white/70 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-white/20">
                <span className="text-[9px] font-bold text-gray-400 uppercase">Crop Recommendation</span>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 mt-0.5">Maize (Corn)</span>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  Best crop match for Guntur soils. High estimated profit of ₹72,000/acre.
                </p>
                <button onClick={() => setView('crop-rec')} className="text-[10px] text-primary font-bold hover:underline mt-2 flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col bg-white/70 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-white/20">
                <span className="text-[9px] font-bold text-gray-400 uppercase">Irrigation Advisory</span>
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 mt-0.5">Delay irrigation by 1 day</span>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  Heavy rainfall predicted tomorrow. Soil has adequate moisture.
                </p>
                <button onClick={() => setView('water')} className="text-[10px] text-primary font-bold hover:underline mt-2 flex items-center gap-1">
                  <span>Open Irrigation Planner</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
