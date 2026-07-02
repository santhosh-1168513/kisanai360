import React, { useState, useEffect } from 'react';
import { HelpCircle, Image as ImageIcon, CheckCircle, Clock, Send, MessageSquare, ShieldAlert, ChevronDown, Sprout } from 'lucide-react';
import { translations } from '../utils/translations';

export default function ExpertConsultation({ currentUser, language }) {
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // new, history
  
  const t = translations[language] || translations.english;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/expert/history?userId=${currentUser.userId}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch expert requests:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('userId', currentUser.userId);
    formData.append('farmerName', currentUser.name);
    formData.append('phone', currentUser.phone);
    formData.append('description', description);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const res = await fetch('/api/expert/request', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDescription('');
        setSelectedFile(null);
        setPreviewURL(null);
        fetchRequests();
        setActiveTab('history');
      } else {
        alert(data.error || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request to backend. Is Flask running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
          {t.expertTitle}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          {t.expertDesc}
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 border-b border-gray-150 dark:border-slate-800 pb-1 shrink-0">
        <button
          onClick={() => setActiveTab('new')}
          className={`pb-3.5 text-xs font-bold transition-all relative ${
            activeTab === 'new'
              ? 'text-primary dark:text-secondary'
              : 'text-gray-450 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <span>Ask Expert</span>
          {activeTab === 'new' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary dark:bg-secondary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-primary dark:text-secondary'
              : 'text-gray-450 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <span>{t.myRequests}</span>
          <span className="bg-slate-100 dark:bg-slate-800 text-gray-500 rounded-full px-2 py-0.5 text-[9px] font-extrabold">
            {requests.length}
          </span>
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary dark:bg-secondary rounded-full" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main interactive area based on tab */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              {/* Problem Description */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">{t.describeProblem}</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="E.g., Tomato plants are showing brown spots on bottom leaves. Spreading to upper foliage..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-xs outline-none focus:border-primary transition dark:text-white leading-normal resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">{t.uploadProblemImg}</label>
                
                <div className="flex items-center gap-4">
                  <label className="bg-primary-light dark:bg-slate-800 text-primary dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer hover:opacity-85 transition">
                    <ImageIcon className="w-4 h-4 text-accent" />
                    <span>Upload Leaf Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                  </label>
                  
                  {previewURL && (
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                      <img src={previewURL} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs font-poppins mt-2"
              >
                {isSubmitting ? (
                  <span>Submitting request to RSK Center...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-accent" />
                    <span>{t.submitToExpert}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <div 
                    key={req.id}
                    className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left"
                  >
                    {/* Status header */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-slate-850">
                      <div className="flex items-center gap-2">
                        {req.status === 'Pending' ? (
                          <div className="inline-flex items-center gap-1 bg-warning/10 text-warning px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border border-warning/10">
                            <Clock className="w-3 h-3" />
                            <span>{t.pendingStatus}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border border-emerald-100 dark:border-emerald-900/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>{t.answeredStatus}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-400">{new Date(req.timestamp).toLocaleDateString()}</span>
                    </div>

                    {/* Farmer message */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-400 font-bold uppercase">My Inquiry</span>
                      <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold">
                        {req.description}
                      </p>
                    </div>

                    {/* AI Pre-Screening Summary */}
                    {req.aiSummary && (
                      <div className="bg-emerald-500/5 dark:bg-slate-950/20 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 text-left">
                        <div className="bg-emerald-500/10 p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                          <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-450" />
                        </div>
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                              AI Pre-Screening Analysis
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                              req.aiSummary.severity === 'High' 
                                ? 'bg-danger/10 text-danger' 
                                : req.aiSummary.severity === 'Medium'
                                ? 'bg-warning/10 text-warning-dark'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              Severity: {req.aiSummary.severity}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Suspected Issue</span>
                              <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{req.aiSummary.suspectedCondition}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-400 font-bold uppercase">Suggested Remedies</span>
                              <span className="text-xs text-gray-655 dark:text-slate-355 leading-normal">{req.aiSummary.suggestedRemedies}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 mt-1 border-t border-gray-100 dark:border-slate-800/80 pt-2">
                            <span className="text-[8px] text-gray-400 font-bold uppercase">AI Diagnostic Analysis</span>
                            <p className="text-xs text-gray-655 dark:text-slate-355 leading-relaxed">{req.aiSummary.aiAnalysis}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expert Answer */}
                    {req.status === 'Answered' && (
                      <div className="bg-primary/5 dark:bg-slate-950/40 border border-primary/10 rounded-2xl p-4 flex gap-3 text-left">
                        <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                              {req.expertName || "RSK Specialist"}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase px-1.5 py-0.5 bg-primary/10 text-primary dark:text-secondary dark:bg-primary-dark/20 rounded">
                              RSK Expert
                            </span>
                          </div>
                          <p className="text-xs text-gray-650 dark:text-slate-355 leading-relaxed font-medium">
                            {req.expertReply}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4">
                  <HelpCircle className="w-10 h-10 text-gray-300" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">No Queries Submitted</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      You haven't submitted any cases to the Rythu Seva Kendra yet. Switch to the 'Ask Expert' tab to send your first inquiry.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info Column (Takes 2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4">
            <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Rythu Seva Kendra (RSK)</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              KisanAI 360 is connected directly to district agricultural centers. If Gemini Vision's diagnostic confidence score falls below 85%, your case is automatically flagged for review.
            </p>
            <div className="flex flex-col gap-2.5 mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-650 dark:text-slate-350">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Response in under 4 hours</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-650 dark:text-slate-350">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Answers from certified extension officers</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-650 dark:text-slate-350">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pest warnings pushed via SMS automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
