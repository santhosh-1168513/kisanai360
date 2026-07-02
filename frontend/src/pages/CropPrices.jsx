import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Search, 
  RefreshCw, 
  Star, 
  Download, 
  Printer, 
  Sparkles, 
  ArrowUpDown, 
  Check, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function CropPrices({ currentUser, language }) {
  // Filters State
  const [commodity, setCommodity] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [market, setMarket] = useState('');
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown Lists Data
  const [commoditiesList, setCommoditiesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [marketsList, setMarketsList] = useState([]);

  // Data Result State
  const [pricesData, setPricesData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // UI Status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [favorites, setFavorites] = useState([]);
  
  // Sorting State
  const [sortField, setSortField] = useState('commodity');
  const [sortDirection, setSortDirection] = useState('asc');

  // AI Insights State
  const [aiInsights, setAiInsights] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mandi_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch initial dropdown metadata (states & commodities)
  useEffect(() => {
    async function loadMeta() {
      try {
        const cRes = await fetch('/api/crop-prices/commodities');
        const cData = await cRes.json();
        if (cData.success) setCommoditiesList(cData.data);

        const sRes = await fetch('/api/crop-prices/states');
        const sData = await sRes.json();
        if (sData.success) setStatesList(sData.data);
      } catch (err) {
        console.error("Error loading metadata:", err);
      }
    }
    loadMeta();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (!state) {
      setDistrictsList([]);
      setDistrict('');
      return;
    }
    async function loadDistricts() {
      try {
        const res = await fetch(`/api/crop-prices/districts?state=${encodeURIComponent(state)}`);
        const data = await res.json();
        if (data.success) {
          setDistrictsList(data.data);
        }
      } catch (err) {
        console.error("Error loading districts:", err);
      }
    }
    loadDistricts();
  }, [state]);

  // Fetch markets when district changes
  useEffect(() => {
    if (!district) {
      setMarketsList([]);
      setMarket('');
      return;
    }
    async function loadMarkets() {
      try {
        const res = await fetch(`/api/crop-prices/markets?district=${encodeURIComponent(district)}`);
        const data = await res.json();
        if (data.success) {
          setMarketsList(data.data);
        }
      } catch (err) {
        console.error("Error loading markets:", err);
      }
    }
    loadMarkets();
  }, [district]);

  // Core Data Fetcher
  const fetchPrices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let queryParams = `page=${currentPage}&limit=${pageSize}`;
      if (commodity) queryParams += `&commodity=${encodeURIComponent(commodity)}`;
      if (state) queryParams += `&state=${encodeURIComponent(state)}`;
      if (district) queryParams += `&district=${encodeURIComponent(district)}`;
      if (market) queryParams += `&market=${encodeURIComponent(market)}`;
      if (date) queryParams += `&date=${encodeURIComponent(date)}`;

      const res = await fetch(`/api/crop-prices?${queryParams}`);
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPricesData(data.data);
        setTotalRecords(data.total || data.count);
      } else {
        setError(data.error || "Failed to load prices data.");
      }
    } catch (err) {
      console.error(err);
      setError("Mandi Price Service is temporarily offline. Please click retry.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when parameters or pagination changes
  useEffect(() => {
    fetchPrices();
  }, [commodity, state, district, market, date, currentPage, pageSize]);

  // Auto-refresh interval (10 minutes = 600,000 ms)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchPrices();
    }, 600000);
    return () => clearInterval(interval);
  }, [autoRefresh, commodity, state, district, market, date]);

  // Reset Filters
  const handleReset = () => {
    setCommodity('');
    setState('');
    setDistrict('');
    setMarket('');
    setDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Toggle favorite commodity
  const toggleFavorite = (commName) => {
    let updated;
    if (favorites.includes(commName)) {
      updated = favorites.filter(f => f !== commName);
    } else {
      updated = [...favorites, commName];
    }
    setFavorites(updated);
    localStorage.setItem('mandi_favorites', JSON.stringify(updated));
  };

  // Calculate metrics based on filtered records in view
  const marketsCount = new Set(pricesData.map(r => r.market)).size;
  const uniqueCommoditiesCount = new Set(pricesData.map(r => r.commodity)).size;
  const validModalPrices = pricesData.map(r => r.modal_price).filter(p => p > 0);
  const avgModalPrice = validModalPrices.length 
    ? Math.round(validModalPrices.reduce((sum, val) => sum + val, 0) / validModalPrices.length) 
    : 0;
  const maxPrice = pricesData.length ? Math.max(...pricesData.map(r => r.max_price)) : 0;
  const minPrice = pricesData.length ? Math.min(...pricesData.map(r => r.min_price).filter(p => p > 0)) : 0;

  // Sorting logic
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedData = [...pricesData].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (typeof valA === 'string') {
      return sortDirection === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortDirection === 'asc' 
        ? (valA || 0) - (valB || 0) 
        : (valB || 0) - (valA || 0);
    }
  });

  // Client side quick search filter
  const filteredSortedData = sortedData.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.commodity.toLowerCase().includes(q) ||
      r.market.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.variety.toLowerCase().includes(q)
    );
  });

  // Fetch AI Insights via Gemini
  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    setAiInsights('');
    try {
      const activeDistrict = district || currentUser.district || 'Guntur';
      const activeCommodity = commodity || '';
      const res = await fetch(`/api/crop-prices/insights?district=${encodeURIComponent(activeDistrict)}&commodity=${encodeURIComponent(activeCommodity)}`);
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.insights);
      } else {
        setAiInsights("AI was unable to generate insights at this time.");
      }
    } catch (e) {
      console.error(e);
      setAiInsights("Error connecting to Gemini API.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // CSV Export logic
  const handleExportCSV = () => {
    if (!pricesData.length) return;
    const headers = ["Commodity", "State", "District", "Market", "Variety", "Grade", "Arrival Date", "Min Price", "Max Price", "Modal Price"];
    const rows = pricesData.map(r => [
      r.commodity,
      r.state,
      r.district,
      r.market,
      r.variety,
      r.grade,
      r.arrival_date,
      r.min_price,
      r.max_price,
      r.modal_price
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mandi_prices_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Data preparation
  const chartPricingData = pricesData.slice(0, 10).map(r => ({
    name: `${r.market.split(' ')[0]} - ${r.commodity}`,
    "Min Price": r.min_price,
    "Max Price": r.max_price,
    "Modal Price": r.modal_price
  }));

  // Pie chart data (commodity breakdown count)
  const commodityCounts = {};
  pricesData.forEach(r => {
    commodityCounts[r.commodity] = (commodityCounts[r.commodity] || 0) + 1;
  });
  const pieData = Object.keys(commodityCounts).map(name => ({
    name,
    value: commodityCounts[name]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex flex-col gap-8 text-left font-inter printable-area">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins flex items-center gap-2">
            Government Crop Prices 🏛️
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Live wholesale commodity Mandi prices retrieved directly from Data.gov.in
          </p>
        </div>
        
        {/* Top Actions */}
        <div className="flex items-center gap-3 print:hidden">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh (10m)
            </span>
          </label>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Favorite Commodities Bar */}
      {favorites.length > 0 && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-wrap gap-2 items-center text-xs print:hidden">
          <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            Bookmarked Crops:
          </span>
          {favorites.map(fav => (
            <button
              key={fav}
              onClick={() => setCommodity(fav)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                commodity === fav
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-750 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-slate-200'
              }`}
            >
              {fav}
            </button>
          ))}
          <button 
            onClick={() => setCommodity('')} 
            className="text-[10px] text-gray-400 hover:text-danger underline ml-auto"
          >
            Clear Selected
          </button>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 print:hidden">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 font-poppins flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> Filter Mandi Pricing Records
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Commodity Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-450 uppercase">Crop Commodity</label>
            <select
              value={commodity}
              onChange={(e) => {
                setCommodity(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-255 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
            >
              <option value="">-- All Commodities --</option>
              {commoditiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* State Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-450 uppercase">State</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setDistrict('');
                setMarket('');
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-255 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
            >
              <option value="">-- All States --</option>
              {statesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-450 uppercase">District</label>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setMarket('');
                setCurrentPage(1);
              }}
              disabled={!state}
              className="rounded-xl border border-gray-255 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- All Districts --</option>
              {districtsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Market Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-455 uppercase">Local Mandi Market</label>
            <select
              value={market}
              onChange={(e) => {
                setMarket(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!district}
              className="rounded-xl border border-gray-255 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white appearance-none disabled:opacity-50 cursor-pointer"
            >
              <option value="">-- All Markets --</option>
              {marketsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-450 uppercase">Arrival Date</label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-255 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-50 dark:border-slate-800/60 pt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
          <button
            onClick={fetchPrices}
            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Apply Search</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Unique Mandis</span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-poppins">{marketsCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Avg Modal Price</span>
          <p className="text-2xl font-black text-primary dark:text-secondary mt-1 font-poppins">₹{avgModalPrice || '0'}/kg</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Highest Price</span>
          <p className="text-2xl font-black text-emerald-500 mt-1 font-poppins">₹{maxPrice ? (maxPrice/100).toFixed(1) : '0'}/kg</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Lowest Price</span>
          <p className="text-2xl font-black text-danger mt-1 font-poppins">₹{minPrice ? (minPrice/100).toFixed(1) : '0'}/kg</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[9px] font-bold text-gray-450 uppercase tracking-wide">Active Commodities</span>
          <p className="text-2xl font-black text-blue-500 mt-1 font-poppins">{uniqueCommoditiesCount}</p>
        </div>
      </div>

      {/* Main Grid: Data Table and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Table View */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-base text-gray-800 dark:text-slate-200 font-poppins">Mandi Price Records</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Showing {filteredSortedData.length} records of {totalRecords}</p>
              </div>
              
              {/* Quick Search */}
              <div className="flex gap-2 w-full sm:w-auto print:hidden">
                <input
                  type="text"
                  placeholder="Quick search mandi/variety..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
                
                <button
                  onClick={handleExportCSV}
                  disabled={!pricesData.length}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold hover:bg-emerald-100/55 transition flex items-center gap-1 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-danger/5 border border-danger/10 text-danger rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span>{error}</span>
                  <button onClick={fetchPrices} className="text-xs underline hover:opacity-80 block text-left mt-1">Try again</button>
                </div>
              </div>
            )}

            {/* Skeletons/Table */}
            {isLoading ? (
              <div className="flex flex-col gap-3 py-10 items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs text-gray-400">Fetching live Mandi pricing indices...</span>
              </div>
            ) : filteredSortedData.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <AlertCircle className="w-10 h-10 text-gray-300" />
                <h5 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">No Mandi Records Found</h5>
                <p className="text-xs text-gray-400 max-w-sm">No records match your selected state/commodity filters. Try resetting filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-2 cursor-pointer hover:text-primary" onClick={() => handleSort('commodity')}>
                        Commodity <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                      </th>
                      <th className="py-3 px-2 cursor-pointer hover:text-primary" onClick={() => handleSort('market')}>
                        Mandi/Market <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                      </th>
                      <th className="py-3 px-2 cursor-pointer hover:text-primary" onClick={() => handleSort('district')}>
                        District/State <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                      </th>
                      <th className="py-3 px-2">Variety</th>
                      <th className="py-3 px-2 cursor-pointer hover:text-primary" onClick={() => handleSort('arrival_date')}>
                        Date <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                      </th>
                      <th className="py-3 px-2 text-right">Min/Max</th>
                      <th className="py-3 px-2 text-right cursor-pointer hover:text-primary" onClick={() => handleSort('modal_price')}>
                        Modal Price <ArrowUpDown className="inline w-3 h-3 ml-0.5" />
                      </th>
                      <th className="py-3 px-2 text-center print:hidden">Fav</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
                    {filteredSortedData.map((row, idx) => {
                      const isFav = favorites.includes(row.commodity);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition text-gray-700 dark:text-slate-300">
                          <td className="py-3 px-2 font-bold text-gray-900 dark:text-white capitalize">{row.commodity}</td>
                          <td className="py-3 px-2 font-semibold">{row.market}</td>
                          <td className="py-3 px-2 text-[11px] opacity-80">{row.district}, {row.state}</td>
                          <td className="py-3 px-2 text-[11px] font-medium">{row.variety}</td>
                          <td className="py-3 px-2 whitespace-nowrap opacity-70">{row.arrival_date}</td>
                          <td className="py-3 px-2 text-right font-medium text-gray-500">
                            ₹{(row.min_price/100).toFixed(1)} - ₹{(row.max_price/100).toFixed(1)}/kg
                          </td>
                          <td className="py-3 px-2 text-right font-extrabold text-primary dark:text-secondary">
                            ₹{(row.modal_price/100).toFixed(1)}/kg
                          </td>
                          <td className="py-3 px-2 text-center print:hidden">
                            <button onClick={() => toggleFavorite(row.commodity)} className="focus:outline-none">
                              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600'}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalRecords > pageSize && (
              <div className="flex justify-between items-center border-t border-gray-50 dark:border-slate-800/60 pt-4 mt-2 print:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-400 font-semibold">Page {currentPage} of {Math.ceil(totalRecords / pageSize)}</span>
                <button
                  disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Charts and AI insights */}
        <div className="flex flex-col gap-8">
          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/15 border border-primary/10 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-primary dark:text-secondary font-poppins flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent animate-pulse" /> Gemini AI Mandi Insights
              </h4>
              <button
                onClick={handleFetchAiInsights}
                disabled={isAiLoading}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 dark:bg-slate-800 border border-primary/10 dark:border-slate-700 text-primary dark:text-slate-200 font-bold rounded-lg text-[10px] shadow-sm transition disabled:opacity-50"
              >
                {isAiLoading ? 'Analysing...' : 'Fetch Insights'}
              </button>
            </div>

            {aiInsights ? (
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-semibold">
                {aiInsights}
              </p>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click 'Fetch Insights' to query Gemini for real-time wholesale trends, market forecasts, and recommended sales actions based on current mandi arrivals.
                </p>
              </div>
            )}
          </div>

          {/* Recharts Price Comparison Bar Chart */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 font-poppins">Mandi Price Comparison</h4>
            <div className="h-60 w-full">
              {chartPricingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPricingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="Modal Price" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Modal Price (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">Select states or crops to display chart comparison</div>
              )}
            </div>
          </div>

          {/* Recharts Commodity Distribution Pie Chart */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 font-poppins">Commodity Distribution</h4>
            <div className="h-60 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-gray-400">Loading distribution metrics...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
