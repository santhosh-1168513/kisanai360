import React from 'react';
import { 
  Sprout, 
  Search, 
  CloudSun, 
  Droplet, 
  Mic, 
  HelpCircle, 
  ArrowRight, 
  Play, 
  CheckCircle,
  Users,
  Compass,
  Smile
} from 'lucide-react';
import { translations } from '../utils/translations';

export default function Landing({ setView, language }) {
  const t = translations[language] || translations.english;

  const features = [
    { 
      title: t.menuCropRec, 
      desc: "Get personalized crop recommendations based on soil health, pH, farm size, and weather conditions using Gemini.", 
      icon: Sprout, 
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
    },
    { 
      title: t.menuDiseaseDet, 
      desc: "Upload leaves or crop photos. AI scans for pathogens instantly and recommends organic or chemical remedies.", 
      icon: Search, 
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" 
    },
    { 
      title: t.menuWeather, 
      desc: "Access localized micro-weather forecasts, dry-spell risk alarms, and crop-specific harvesting guidance.", 
      icon: CloudSun, 
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
    },
    { 
      title: t.menuWater, 
      desc: "Receive smart irrigation plans matching current soil moisture indices to save water and secure maximum yields.", 
      icon: Droplet, 
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
    },
    { 
      title: t.menuVoice, 
      desc: "Talk directly to our AI assistant in Telugu, Hindi, Tamil, or English, receiving instant verbal guidance.", 
      icon: Mic, 
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
    },
    { 
      title: t.menuExpert, 
      desc: "Easily escalate low-confidence AI reports to regional Rythu Seva Kendra scientists for manual review.", 
      icon: HelpCircle, 
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400" 
    }
  ];

  return (
    <div className="flex flex-col gap-20 py-6">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-gray-100 dark:border-slate-800/80 px-6 py-12 md:py-20 md:px-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary dark:text-secondary text-xs font-bold font-poppins">
            <Sprout className="w-4.5 h-4.5" />
            <span>Google Cloud Hackathon Showcase</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight font-poppins">
            Empowering Farmers <br/>
            with <span className="text-primary dark:text-secondary">AI for a Better Tomorrow</span>
          </h1>
          <p className="text-sm md:text-base text-gray-650 dark:text-slate-300 max-w-xl leading-relaxed">
            Smart crop recommendations, disease detection, weather insights, and voice assistance in your language. Double your yields and save resources with data-driven AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setView('register')}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition"
            >
              <span>{t.getStarted}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => alert("Welcome to KisanAI 360! In this interactive web prototype, you can register and explore the dashboard to demo all modules.")}
              className="bg-white hover:bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 text-primary fill-primary dark:text-secondary dark:fill-secondary" />
              <span>{t.watchDemo}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Graphic Mockup */}
        <div className="flex-1 w-full flex justify-center relative">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-primary/10 to-accent/20 flex items-center justify-center animate-pulse-slow">
            {/* Inner Graphic Cards */}
            <div className="absolute top-4 left-4 bg-white dark:bg-slate-850 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 flex items-center gap-3 animate-float">
              <CloudSun className="w-8 h-8 text-amber-500" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400">Rain Expected</p>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Delay Irrigation</p>
              </div>
            </div>

            <div className="absolute bottom-10 right-4 bg-white dark:bg-slate-850 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 flex items-center gap-3 animate-float [animation-delay:2s]">
              <Sprout className="w-8 h-8 text-emerald-500" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400">Best Crop</p>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">Maize (96% Match)</p>
              </div>
            </div>

            {/* Central Phone Mock */}
            <div className="w-48 h-64 bg-slate-900 border-4 border-slate-950 rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col justify-between p-3">
              <div className="w-16 h-3 bg-slate-950 mx-auto rounded-full" />
              
              <div className="flex-1 flex flex-col justify-center items-center gap-2">
                <Mic className="w-10 h-10 text-accent animate-bounce" />
                <p className="text-[10px] text-white font-medium text-center px-2 lang-telugu">
                  "నా వరి పంట పసుపు రంగులోకి మారింది"
                </p>
                <div className="w-full bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                  <p className="text-[8px] text-emerald-400 text-left leading-normal font-medium">
                    నత్రజని లోపం ఉండవచ్చు. యూరియా వేయండి.
                  </p>
                </div>
              </div>
              
              <div className="w-12 h-1 bg-slate-950 mx-auto rounded-full mb-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800/80 shadow-sm text-center">
        <div>
          <h3 className="text-3xl font-extrabold text-primary dark:text-secondary font-poppins">10K+</h3>
          <p className="text-xs font-bold text-gray-400 mt-1">Active Farmers</p>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-primary dark:text-secondary font-poppins">50+</h3>
          <p className="text-xs font-bold text-gray-400 mt-1">Crops Supported</p>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-primary dark:text-secondary font-poppins">98%</h3>
          <p className="text-xs font-bold text-gray-400 mt-1">AI Recommendation Accuracy</p>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-primary dark:text-secondary font-poppins">24/7</h3>
          <p className="text-xs font-bold text-gray-400 mt-1">Agricultural Help Desk</p>
        </div>
      </section>

      {/* Core Features */}
      <section className="flex flex-col gap-10">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
            Comprehensive Farming Suite
          </h2>
          <p className="text-xs sm:text-sm text-gray-450 dark:text-slate-400 max-w-xl mx-auto">
            Our platform connects smart IoT fields, weather models, and visual diagnostics via Google Cloud models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 text-left flex flex-col gap-4 hover-card-lift shadow-sm"
              >
                <div className={`p-3 rounded-2xl w-fit ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 font-poppins">
                  {feat.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="flex flex-col gap-10 bg-slate-100/50 dark:bg-slate-900/40 rounded-3xl p-8 border border-gray-100 dark:border-slate-800/80">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-450 dark:text-slate-400">
            A simple 4-step workflow to maximize crop yields.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            { step: "1", title: "Farmer Onboarding", desc: "Select language, type in your location, soil type, and primary water source." },
            { step: "2", title: "AI Parameters Scan", desc: "AI references real-time weather APIs, satellite records, and leaf images." },
            { step: "3", title: "Smart Advice Delivery", desc: "Receive immediate advisory instructions regarding crop type, irrigation, and fertilizers." },
            { step: "4", title: "Boost Financial Yield", desc: "Track improvements, reduce crop damage, and connect with regional experts." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 text-left flex flex-col gap-3 relative shadow-sm">
              <div className="absolute top-4 right-4 text-3xl font-black text-primary/10 dark:text-secondary/15 font-poppins">
                {item.step}
              </div>
              <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mt-2 font-poppins">
                {item.title}
              </h4>
              <p className="text-xs text-gray-400 leading-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
