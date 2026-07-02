import React, { useState, useEffect } from 'react';
import { Shield, Users, HelpCircle, FileCheck, AlertTriangle, Send, Loader2, Sparkles, Compass, Sprout } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { translations } from '../utils/translations';

export default function AdminDashboard({ currentUser, language }) {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const t = translations[language] || translations.english;

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/expert/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch all requests
      const requestsRes = await fetch('/api/expert/all');
      const requestsData = await requestsRes.json();
      if (requestsData.success) {
        setRequests(requestsData.requests);
      }
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expert/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          expertReply: replyText,
          expertName: currentUser.name
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText('');
        setSelectedRequest(null);
        fetchAdminData(); // Refresh metrics
        alert("Consultation reply sent to farmer successfully!");
      } else {
        alert(data.error || "Failed to submit reply.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-xs text-gray-400">Loading Admin Portal...</p>
      </div>
    );
  }

  // Format Recharts data from backend stats
  const chartData = stats?.cropDistribution
    ? Object.keys(stats.cropDistribution).map(key => ({
        name: key,
        Count: stats.cropDistribution[key]
      }))
    : [];

  const COLORS = ['#2E7D32', '#4CAF50', '#FBC02D', '#2196F3'];

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-150 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
            {t.adminTitle}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitoring agricultural parameters and answering farmer escalations.
          </p>
        </div>
        <div className="bg-primary/10 text-primary border border-primary/20 dark:text-secondary dark:border-secondary/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold font-poppins">
          <Shield className="w-4 h-4 text-accent" />
          <span>Active Session: {currentUser.name}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t.totalFarmers, value: stats?.totalFarmers || 0, icon: Users, color: "text-blue-500 bg-blue-50 dark:bg-slate-850" },
          { label: "Pending Queries", value: stats?.pendingQueries || 0, icon: HelpCircle, color: "text-warning bg-warning/5 dark:bg-slate-850" },
          { label: "Answered cases", value: stats?.answeredQueries || 0, icon: FileCheck, color: "text-emerald-500 bg-emerald-50 dark:bg-slate-850" },
          { label: t.activeAlerts, value: stats?.totalAlerts || 0, icon: AlertTriangle, color: "text-danger bg-danger/5 dark:bg-slate-850" }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between hover-card-lift"
            >
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase">{item.label}</span>
                <h3 className="text-2xl font-black text-gray-800 dark:text-slate-200 mt-1 font-poppins">{item.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl shrink-0 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Double Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side: Pending Consultation reply center (Takes 3/5 width) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-bold text-base text-gray-800 dark:text-slate-200 font-poppins">{t.unansweredQueries}</h3>
            
            {requests.length > 0 ? (
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setReplyText(req.expertReply || '');
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition ${
                      selectedRequest?.id === req.id
                        ? 'border-primary bg-primary/5 dark:border-secondary dark:bg-secondary/5'
                        : 'border-gray-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 hover:border-gray-200 dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800/80 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-850 dark:text-slate-200">{req.farmerName}</span>
                        <span className="text-[9px] text-gray-400 font-bold">{req.phone}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        req.status === 'Pending' 
                          ? 'bg-warning/10 text-warning' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-650 dark:text-slate-350 line-clamp-2 leading-relaxed">{req.description}</p>
                    <span className="text-[8px] text-gray-400 mt-2 block">{new Date(req.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No farmer consultation requests found.</p>
            )}
          </div>

          {/* Expert Reply Form overlay when selected */}
          {selectedRequest && (
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-md text-left flex flex-col gap-4 animate-float">
              <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-slate-850">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Replying to Case</span>
                  <h4 className="font-bold text-sm text-gray-850 dark:text-slate-200 mt-0.5">
                    {selectedRequest.farmerName} ({selectedRequest.id})
                  </h4>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/25 p-3 rounded-2xl text-xs text-gray-655 dark:text-slate-355 border border-gray-100 dark:border-slate-850">
                <span className="font-bold block text-[10px] text-gray-450 uppercase mb-1">Farmer Description</span>
                {selectedRequest.description}
              </div>

              {selectedRequest.aiSummary && (
                <div className="bg-emerald-500/5 dark:bg-slate-950/20 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 text-left">
                  <div className="bg-emerald-500/10 p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-1 w-full text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-400">AI Pre-Analysis Diagnostic</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        selectedRequest.aiSummary.severity === 'High' 
                          ? 'bg-danger/10 text-danger' 
                          : 'bg-warning/10 text-warning-dark'
                      }`}>
                        Severity: {selectedRequest.aiSummary.severity}
                      </span>
                    </div>
                    <p className="mt-1 font-bold text-gray-800 dark:text-slate-200">
                      Suspected: {selectedRequest.aiSummary.suspectedCondition}
                    </p>
                    <p className="text-gray-650 dark:text-slate-355 mt-0.5 font-medium">
                      {selectedRequest.aiSummary.aiAnalysis}
                    </p>
                    <p className="text-gray-655 dark:text-slate-355 mt-1 border-t border-gray-100 dark:border-slate-800/80 pt-1 font-medium">
                      <strong>AI Suggestion:</strong> {selectedRequest.aiSummary.suggestedRemedies}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleReplySubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-slate-450">{t.typeReplyPlaceholder}</label>
                  <textarea
                    rows="4"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                    placeholder="Provide recommendations, dosages, or chemical treatment names..."
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-xs outline-none focus:border-primary transition dark:text-white leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !replyText.trim()}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs font-poppins"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-accent" />
                      <span>{t.sendReplyBtn}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Recharts Chart & Outbreak list (Takes 2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recommended crop statistics chart */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left">
            <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 mb-4 font-poppins">{t.cropPopularity}</h3>
            
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="Count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Outbreak Heatmap list */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">{t.pestRiskHeatmap}</h3>
              <p className="text-[9px] text-gray-400 mt-0.5">Simulated coordinates risk level</p>
            </div>

            <div className="flex flex-col gap-3">
              {stats?.pestHeatmap?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-slate-850 rounded-xl transition border border-transparent">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4.5 h-4.5 text-gray-400 animate-spin [animation-duration:8s]" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{item.district}</span>
                      <p className="text-[9px] text-gray-400 mt-0.5">Outbreak Threat: {item.pest}</p>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.risk > 70 
                      ? 'bg-danger/10 text-danger' 
                      : (item.risk > 40 ? 'bg-warning/10 text-warning' : 'bg-emerald-50 text-emerald-600')
                  }`}>
                    {item.risk}% Risk
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
