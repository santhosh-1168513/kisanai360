import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Droplet, 
  Search, 
  Printer, 
  Download, 
  Sprout,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { translations } from '../utils/translations';

export default function Reports({ currentUser, language }) {
  const [activeTab, setActiveTab] = useState('crop');
  const [diseaseHistory, setDiseaseHistory] = useState([]);
  const [waterHistory, setWaterHistory] = useState([]);
  const [cropRecHistory, setCropRecHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const t = translations[language] || translations.english;

  useEffect(() => {
    async function loadReportsData() {
      setIsLoading(true);
      try {
        // Fetch real user disease history
        const diseaseRes = await fetch(`/api/disease/history?userId=${currentUser.userId}`);
        const diseaseData = await diseaseRes.json();
        if (diseaseData.success) {
          setDiseaseHistory(diseaseData.history || []);
        }

        // Fetch real user irrigation logs
        const waterRes = await fetch(`/api/irrigation-history?userId=${currentUser.userId}`);
        const waterData = await waterRes.json();
        if (waterData.success) {
          setWaterHistory(waterData.history || []);
        }

        // Setup some default crop recommendations for history representation
        setCropRecHistory([
          { date: '2026-07-02', crop: 'Tomato', confidence: 95, soilPH: 6.5, area: currentUser.farmSize || '2.5', profit: 68000 },
          { date: '2026-07-01', crop: 'Maize', confidence: 96, soilPH: 6.8, area: currentUser.farmSize || '2.5', profit: 72000 },
          { date: '2026-06-15', crop: 'Groundnut', confidence: 92, soilPH: 6.2, area: currentUser.farmSize || '2.5', profit: 45000 }
        ]);
      } catch (e) {
        console.error("Failed to load reports data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadReportsData();
  }, [currentUser]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Compile crop chart metrics
  const cropPieData = [
    { name: 'Maize', value: 45 },
    { name: 'Tomato', value: 35 },
    { name: 'Groundnut', value: 20 }
  ];
  const COLORS = ['#10b981', '#3b82f6', '#fbbf24', '#f87171'];

  // Compile disease scan stats
  const diseaseCounts = diseaseHistory.reduce((acc, curr) => {
    const label = curr.diseaseName || 'Healthy';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const diseaseChartData = Object.keys(diseaseCounts).map(name => ({
    name: name.replace('Tomato ', '').replace('Potato ', '').replace('Pepper bell ', ''),
    Scans: diseaseCounts[name]
  }));

  // Fallback disease metrics if history is empty
  const fallbackDiseaseData = [
    { name: 'Early Blight', Scans: 4 },
    { name: 'Late Blight', Scans: 2 },
    { name: 'Healthy Leaf', Scans: 5 },
    { name: 'Leaf Curl', Scans: 1 }
  ];
  const activeDiseaseChartData = diseaseChartData.length > 0 ? diseaseChartData : fallbackDiseaseData;

  // Compile water history metrics
  const waterChartData = waterHistory.slice(0, 7).reverse().map((w, idx) => ({
    day: `Log ${idx + 1}`,
    Applied: w.water_applied_liters / 100, // scaled for display
    Saved: w.water_saved_liters / 100
  }));

  // Fallback water chart data
  const fallbackWaterData = [
    { day: 'Mon', Applied: 180, Saved: 50 },
    { day: 'Tue', Applied: 140, Saved: 85 },
    { day: 'Wed', Applied: 210, Saved: 30 },
    { day: 'Thu', Applied: 0, Saved: 160 },
    { day: 'Fri', Applied: 120, Saved: 110 },
    { day: 'Sat', Applied: 160, Saved: 75 },
    { day: 'Sun', Applied: 110, Saved: 120 }
  ];
  const activeWaterChartData = waterChartData.length > 0 ? waterChartData : fallbackWaterData;

  // Monthly yield yields data
  const monthlyYieldData = [
    { month: 'Jan', Yield: 12.5, Target: 15 },
    { month: 'Feb', Yield: 14.2, Target: 15 },
    { month: 'Mar', Yield: 15.8, Target: 15 },
    { month: 'Apr', Yield: 18.0, Target: 18 },
    { month: 'May', Yield: 16.5, Target: 18 },
    { month: 'Jun', Yield: 19.2, Target: 20 }
  ];

  return (
    <div className="flex flex-col gap-8 text-left font-inter reports-page-root">
      
      {/* Scoped print styles inside components so it compiles perfectly without dependency edits */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .reports-page-root, .reports-page-root * {
            visibility: visible;
          }
          .reports-page-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
            {t.menuReports} 📊
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Analyze historical crop suitability, diagnostic scan history, water conservation meters, and yield values.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-850 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>{t.printReport}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800 pb-px no-print overflow-x-auto">
        {[
          { id: 'crop', label: t.cropReport, icon: Sprout },
          { id: 'disease', label: t.diseaseReport, icon: Search },
          { id: 'water', label: t.waterReport, icon: Droplet },
          { id: 'monthly', label: t.monthlySummary, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
                isActive
                  ? 'border-primary text-primary dark:text-secondary'
                  : 'border-transparent text-gray-400 hover:text-gray-655 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main reports body card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-155 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-8 print-card">
        
        {/* Tab 1: Crop report */}
        {activeTab === 'crop' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">{t.cropReport}</h3>
              <p className="text-xs text-gray-450">Historical analysis of crop recommendations matching your farm parameters.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Suitability Chart */}
              <div className="flex flex-col gap-4 border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins">Historical Crop Selection Shares (%)</span>
                <div className="h-64 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {cropPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommendation Records Table */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins">Recent Crop Recommendations</span>
                <div className="overflow-x-auto border border-gray-100 dark:border-slate-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-850">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Crop</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Match %</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Est. Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {cropRecHistory.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">{rec.date}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-800 dark:text-slate-200">{rec.crop}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">{rec.confidence}%</td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-800 dark:text-slate-200 font-semibold">₹{rec.profit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Disease Diagnostic Report */}
        {activeTab === 'disease' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">{t.diseaseReport}</h3>
              <p className="text-xs text-gray-450">Summary of crop health diagnoses and pathogen scans completed.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Scan Bar Chart */}
              <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins block mb-4">Diagnostic Scan Frequency</span>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeDiseaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                      <YAxis stroke="#9CA3AF" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="Scans" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pathogen Scan History List */}
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins">Recent Diagnostic Logs</span>
                <div className="max-h-72 overflow-y-auto border border-gray-100 dark:border-slate-800 rounded-2xl">
                  {diseaseHistory.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                      {diseaseHistory.map((log) => (
                        <div key={log.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-slate-200">{log.crop} - {log.diseaseName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{log.timestamp.split('T')[0]}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${
                            log.diseaseName.includes('healthy') 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                          }`}>
                            {log.confidence}% Match
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No recent leaf scans found. Upload leaf photos under Crop Health tab to populate logs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Water advisory report */}
        {activeTab === 'water' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">{t.waterReport}</h3>
              <p className="text-xs text-gray-450">Weekly water application volumes vs. water saved (in Liters × 100).</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Irrigation area chart */}
              <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins block mb-4">Irrigation & Conservation (Liters)</span>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeWaterChartData}>
                      <defs>
                        <linearGradient id="appliedColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="savedColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                      <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                      <YAxis stroke="#9CA3AF" fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Applied" stroke="#3b82f6" fillOpacity={1} fill="url(#appliedColor)" strokeWidth={2} name="Water Applied (L)" />
                      <Area type="monotone" dataKey="Saved" stroke="#10b981" fillOpacity={1} fill="url(#savedColor)" strokeWidth={2} name="Water Saved (L)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Water statistics grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Total Water Saved</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-poppins">1,280 L</span>
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">Equivalent to 12.8% savings compared to standard methods.</p>
                </div>
                
                <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Groundwater Table</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 font-poppins">14.5 m</span>
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">Depth below surface. Medium water table level.</p>
                </div>

                <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Avg. Soil Moisture</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 font-poppins">72%</span>
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">Optimal range for current Tomato crops.</p>
                </div>

                <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Advisories Received</span>
                  <span className="text-2xl font-black text-amber-500 mt-2 font-poppins">8 Logs</span>
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">Irrigation planners processed based on forecast.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Monthly yield report */}
        {activeTab === 'monthly' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">Agricultural Yield & Summaries</h3>
              <p className="text-xs text-gray-450">Monthly yield outputs (安排/acre) compared against target goals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Yield Bar Chart */}
              <div className="border border-gray-100 dark:border-slate-800/80 p-5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-poppins block mb-4">Yield Outputs vs. Target</span>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyYieldData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} />
                      <YAxis stroke="#9CA3AF" fontSize={10} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar dataKey="Yield" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual Yield" />
                      <Bar dataKey="Target" fill="#E5E7EB" radius={[4, 4, 0, 0]} className="dark:fill-slate-800" name="Target Yield" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Yearly Summary Card */}
              <div className="border border-gray-100 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between bg-gradient-to-br from-primary/5 to-accent/15">
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-extrabold text-primary dark:text-secondary uppercase tracking-wider font-poppins">Yearly Summary (2026)</h4>
                  <div className="h-px bg-primary/10 my-1"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total Crops Cultivated:</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">3 (Maize, Tomato, Groundnut)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Cumulative Est. Profit:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹1,85,000</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Total Water Conserved:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">4,350 Liters</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Expert Queries Solved:</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">5 Consultations</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-white/20">
                  <span className="text-[10px] font-bold text-primary dark:text-secondary uppercase">Yearly AI Advisory recommendation</span>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                    Your soil nutrient retention has improved by 8% due to groundnut peg gypsum enrichment. Continue crop rotation cycles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
