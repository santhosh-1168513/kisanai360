import React, { useState, useEffect } from 'react';
import { CloudSun, Sun, CloudRain, CloudLightning, Wind, Droplets, Thermometer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations } from '../utils/translations';

export default function WeatherDashboard({ currentUser, language }) {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = translations[language] || translations.english;

  useEffect(() => {
    async function fetchWeatherData() {
      try {
        const res = await fetch(`/api/weather/dashboard?location=${currentUser.district || 'Guntur'}, ${currentUser.village || 'Andhra Pradesh'}`);
        const data = await res.json();
        if (data.success) {
          setWeather(data.weather);
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWeatherData();
  }, [currentUser]);

  const getWeatherIcon = (cond) => {
    const c = cond?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-8 h-8 text-sky-500" />;
    if (c.includes('thunderstorm') || c.includes('storm')) return <CloudLightning className="w-8 h-8 text-indigo-500" />;
    if (c.includes('cloud')) return <CloudSun className="w-8 h-8 text-amber-500" />;
    return <Sun className="w-8 h-8 text-amber-500 animate-spin [animation-duration:15s]" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-xs text-gray-400">Loading Weather Intelligence...</p>
      </div>
    );
  }

  const advisory = weather?.aiAdvisory;

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
          {t.weatherTitle}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Real-time weather parameters and crop advisory for {weather?.location}.
        </p>
      </div>

      {/* Main Meteorological Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Weather Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-slate-800/80">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Current Weather</span>
              <h2 className="text-5xl font-black text-gray-900 dark:text-white mt-1 font-poppins">
                {weather?.temperature}°C
              </h2>
              <p className="text-xs font-bold text-gray-700 dark:text-slate-350 mt-1 uppercase tracking-wide">
                {weather?.condition}
              </p>
            </div>
            {getWeatherIcon(weather?.condition)}
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-100 dark:border-slate-800/85">
            <div className="flex items-center gap-2.5">
              <Wind className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase font-bold">{t.windSpeed}</span>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{weather?.windSpeed} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase font-bold">{t.humidity}</span>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{weather?.humidity}%</p>
              </div>
            </div>
          </div>

          <div className="pt-4 text-left">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Soil parameters</span>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs font-semibold text-gray-650 dark:text-slate-350">Moisture Content</span>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{weather?.soilMoisture}%</span>
            </div>
          </div>
        </div>

        {/* Hazard Risk Gauges */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-left">
          <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Environmental Risk Index</h3>
          
          {/* Dry Spell Risk */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-650 dark:text-slate-350">
              <span>{t.drySpellRisk}</span>
              <span>{weather?.soilMoisture < 60 ? 'Medium (55%)' : 'Low (15%)'}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${weather?.soilMoisture < 60 ? 'w-[55%] bg-warning' : 'w-[15%] bg-emerald-500'}`} 
              />
            </div>
          </div>

          {/* Flood Risk */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-650 dark:text-slate-350">
              <span>{t.floodRisk}</span>
              <span>{weather?.rainfall > 10 ? 'Medium (60%)' : 'Low (10%)'}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${weather?.rainfall > 10 ? 'w-[60%] bg-warning' : 'w-[10%] bg-emerald-500'}`} 
              />
            </div>
          </div>

          {/* Heat Stress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-650 dark:text-slate-350">
              <span>{t.heatStress}</span>
              <span>{weather?.temperature > 35 ? 'High (80%)' : 'Low (20%)'}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${weather?.temperature > 35 ? 'w-[80%] bg-danger' : 'w-[20%] bg-emerald-500'}`} 
              />
            </div>
          </div>
        </div>

        {/* AI Met Advisory */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/10 border border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
              <h3 className="font-bold text-sm text-primary dark:text-secondary font-poppins">
                {t.advisoryFromAI}
              </h3>
            </div>
            
            {advisory?.hazardRating === 'Medium' || advisory?.hazardRating === 'High' ? (
              <div className="bg-warning/10 text-warning-dark border border-warning/15 p-3 rounded-2xl flex gap-2 text-xs leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
                <span>Smart warning: {advisory.hazardType} risk detected.</span>
              </div>
            ) : (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/20 p-3 rounded-2xl flex gap-2 text-xs leading-normal">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Normal climate conditions. Keep field clear.</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5 mt-2">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.irrigationGuidance}</span>
                <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold mt-0.5">
                  {advisory?.irrigationAdvice}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.fertilizerGuidance}</span>
                <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold mt-0.5">
                  {advisory?.fertilizerAdvice}
                </p>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-gray-400 mt-4 border-t border-primary/10 pt-3">
            Advisory updated based on live district meteorological models.
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
        <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 mb-6 font-poppins">
          {t.forecast7Day}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {weather?.forecast?.map((day, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[160px] transition-all hover:shadow-md ${
                day.day === 'Tue' // Tomorrow highlights
                  ? 'bg-primary/5 border-primary/20 dark:bg-slate-850 dark:border-slate-700'
                  : 'bg-slate-50/50 dark:bg-slate-950/20 border-gray-100 dark:border-slate-850'
              }`}
            >
              <div className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase">{day.day}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{day.date}</div>
              
              <div className="my-3 flex flex-col items-center">
                {getWeatherIcon(day.condition)}
                <span className="text-[9px] text-gray-400 capitalize mt-1.5 font-semibold">{day.condition}</span>
              </div>
              
              <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-center items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-gray-800 dark:text-slate-200">{day.tempMax}°</span>
                  <span className="text-gray-400 font-medium">{day.tempMin}°</span>
                </div>
                {day.rainProb > 20 && (
                  <div className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">
                    {day.rainProb}% Rain
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
