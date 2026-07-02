import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Camera, Check, Info, Volume2, VolumeX, AlertTriangle, ShieldCheck, Mic, MicOff, Send, Smartphone, Loader2 } from 'lucide-react';
import { translations } from '../utils/translations';

const ALL_CROPS = [
  { value: 'tomato', label: 'Tomato (టమాటా)' },
  { value: 'chili', label: 'Chilli (మిరప)' },
  { value: 'cotton', label: 'Cotton (ప్రత్తి)' },
  { value: 'paddy', label: 'Paddy / Rice (వరి)' },
  { value: 'maize', label: 'Maize / Corn (మొక్కజొన్న)' },
  { value: 'chickpea', label: 'Chickpea (శనగలు)' },
  { value: 'kidneybeans', label: 'Kidney Beans (రాజ్మా)' },
  { value: 'pigeonpeas', label: 'Pigeon Peas (కందులు)' },
  { value: 'mothbeans', label: 'Moth Beans (బొబ్బర్లు)' },
  { value: 'mungbean', label: 'Mung Bean / Green Gram (పెసలు)' },
  { value: 'blackgram', label: 'Black Gram (మినుములు)' },
  { value: 'lentil', label: 'Lentil (చిక్కుడు)' },
  { value: 'pomegranate', label: 'Pomegranate (దానిమ్మ)' },
  { value: 'banana', label: 'Banana (అరటి)' },
  { value: 'mango', label: 'Mango (మామిడి)' },
  { value: 'grapes', label: 'Grapes (ద్రాక్ష)' },
  { value: 'watermelon', label: 'Watermelon (పుచ్చకాయ)' },
  { value: 'muskmelon', label: 'Muskmelon (కర్బూజా)' },
  { value: 'apple', label: 'Apple (ఆపిల్)' },
  { value: 'orange', label: 'Orange / Citrus (నారింజ)' },
  { value: 'papaya', label: 'Papaya (బొప్పాయి)' },
  { value: 'coconut', label: 'Coconut (కొబ్బరికాయ)' },
  { value: 'jute', label: 'Jute (జనపనార)' },
  { value: 'coffee', label: 'Coffee (కాఫీ)' },
  { value: 'onion', label: 'Onion (ఉల్లిపాయ)' }
];

export default function DiseaseDetection({ currentUser, language }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [cropHint, setCropHint] = useState('tomato');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [history, setHistory] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Voice symptoms and Expert/SMS states
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [isSymptomListening, setIsSymptomListening] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  
  const symptomRecRef = useRef(null);
  const t = translations[language] || translations.english;

  useEffect(() => {
    fetchHistory();
  }, []);

  // Update searchQuery when cropHint changes initially
  useEffect(() => {
    const initialCrop = ALL_CROPS.find(c => c.value === cropHint);
    if (initialCrop) {
      setSearchQuery(initialCrop.label);
    }
  }, [cropHint]);

  // Click outside to close searchable dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#searchable-crop-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const filteredCrops = ALL_CROPS.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/disease/history?userId=${currentUser.userId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load disease history:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setDiagnosis(null);
      setEscalated(false);
      setSmsSent(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setDiagnosis(null);
      setEscalated(false);
      setSmsSent(false);
    }
  };

  // Speech Recognition for symptoms description
  const toggleSymptomListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isSymptomListening) {
      symptomRecRef.current.stop();
      setIsSymptomListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      const localeMap = {
        telugu: 'te-IN',
        hindi: 'hi-IN',
        tamil: 'ta-IN',
        english: 'en-IN'
      };
      rec.lang = localeMap[language] || 'en-IN';
      rec.onstart = () => setIsSymptomListening(true);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setSymptomsDescription(prev => prev ? prev + ' ' + transcript : transcript);
      };
      rec.onerror = (err) => {
        console.error(err);
        setIsSymptomListening(false);
      };
      rec.onend = () => setIsSymptomListening(false);
      symptomRecRef.current = rec;
      rec.start();
    }
  };

  const handleEscalateToExpert = async () => {
    if (!diagnosis) return;
    setIsEscalating(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser.userId);
      formData.append('farmerName', currentUser.name || 'Farmer');
      formData.append('phone', currentUser.phone || '');
      formData.append('description', `Escalated Scan: ${diagnosis.crop} - ${diagnosis.diseaseName}. Farmer notes: ${symptomsDescription || 'No additional notes'}.`);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const res = await fetch('/api/expert/request', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setEscalated(true);
        alert("Scan successfully escalated to Rythu Seva Kendra! A specialist will review it within 4 hours.");
      } else {
        alert("Failed to escalate request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error escalating to expert.");
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendSMS = async () => {
    if (!diagnosis) return;
    try {
      const smsBody = `Crop: ${diagnosis.crop} | Disease: ${diagnosis.diseaseName}. Organic: ${diagnosis.organicTreatment}. Chem: ${diagnosis.chemicalTreatment}`;
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          phone: currentUser.phone || '+91 98765 43210',
          title: "Crop Diagnosis Advisory",
          message: smsBody
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmsSent(true);
        alert(`SMS diagnosis alert successfully sent to ${currentUser.phone || '+91 98765 43210'}!`);
      } else {
        alert(data.error || "Failed to dispatch SMS alert.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please upload or capture a leaf photo first.");
      return;
    }
    setIsAnalyzing(true);
    setDiagnosis(null);
    setEscalated(false);
    setSmsSent(false);

    const formData = new FormData();
    formData.append('userId', currentUser.userId);
    formData.append('cropHint', cropHint);
    formData.append('symptomsDescription', symptomsDescription);
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/disease/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiagnosis(data.diagnosis);
        fetchHistory(); // Refresh scan history list
      } else {
        alert(data.error || "Leaf diagnosis failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting the backend server. Is Flask running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Browser TTS readout for leaf remedies
  const handleListenRemedies = () => {
    if (!diagnosis || !('speechSynthesis' in window)) return;
    
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `${t.detectedDisease}: ${diagnosis.diseaseName}. ${t.orgTreatment}: ${diagnosis.organicTreatment}. ${t.chemTreatment}: ${diagnosis.chemicalTreatment}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set locale
    const localeMap = {
      telugu: 'te-IN',
      hindi: 'hi-IN',
      tamil: 'ta-IN',
      english: 'en-IN'
    };
    utterance.lang = localeMap[language] || 'en-IN';
    
    utterance.onend = () => {
      setIsPlayingAudio(false);
    };
    
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Load a historical diagnosis to inspect it
  const handleSelectHistoryItem = (item) => {
    setDiagnosis(item);
    setPreviewURL(null);
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col gap-8 text-left font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-poppins">
          {t.diseaseTitle}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          {t.diseaseDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Scanners and Uploaders (Takes 2/5 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            {/* Searchable Crop Selection */}
            <div className="flex flex-col gap-1.5 relative" id="searchable-crop-container">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-450">{t.cropType}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search crop (e.g. Mango, Coffee...)"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent pl-4 pr-10 py-2.5 text-xs outline-none focus:border-primary transition dark:text-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-[64px] left-0 right-0 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 py-1">
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map((c) => (
                      <div
                        key={c.value}
                        onClick={() => {
                          setCropHint(c.value);
                          setSearchQuery(c.label);
                          setIsDropdownOpen(false);
                        }}
                        className={`px-4 py-2 text-xs cursor-pointer hover:bg-primary/5 dark:hover:bg-slate-800 transition text-gray-700 dark:text-slate-200 flex items-center justify-between ${
                          cropHint === c.value ? 'font-bold bg-primary/5 dark:bg-slate-800 text-primary dark:text-secondary' : ''
                        }`}
                      >
                        <span>{c.label}</span>
                        {cropHint === c.value && <Check className="w-3.5 h-3.5 text-primary dark:text-secondary" />}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2.5 text-xs text-gray-400 italic">No crops found</div>
                  )}
                </div>
              )}
            </div>

            {/* Drag Drop Area */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-250 dark:border-slate-800 rounded-2xl h-60 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/20 relative overflow-hidden group hover:border-primary/55 transition cursor-pointer"
            >
              {/* Scan sweep line */}
              {isAnalyzing && (
                <div className="animate-scan" />
              )}

              {previewURL ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-550">
                  <img src={previewURL} alt="Leaf Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40" />
                  <button 
                    onClick={() => { setPreviewURL(null); setSelectedFile(null); }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1 hover:scale-105 transition"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                  <div className="bg-primary/5 p-4 rounded-full group-hover:scale-110 transition">
                    <Upload className="w-8 h-8 text-primary/60 dark:text-secondary/60" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{t.dragDropText}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{t.supportedFormats}</p>
                  </div>
                </label>
              )}
            </div>

            {/* Symptoms Voice Logger */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-450">Verbal Crop Symptoms (నోటి ద్వారా లక్షణాలు)</label>
                <button
                  type="button"
                  onClick={toggleSymptomListening}
                  className={`p-1.5 rounded-full shadow transition-all ${
                    isSymptomListening 
                      ? 'bg-danger text-white animate-pulse' 
                      : 'bg-primary-light text-primary dark:bg-slate-800 dark:text-slate-350 hover:opacity-85'
                  }`}
                  title={isSymptomListening ? "Listening..." : "Record symptoms description"}
                >
                  {isSymptomListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
              <textarea
                rows="2"
                value={symptomsDescription}
                onChange={(e) => setSymptomsDescription(e.target.value)}
                placeholder="E.g., Tomato leaves have yellow spots and are turning brown..."
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-3 py-2 text-xs outline-none focus:border-primary transition dark:text-white leading-normal resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition text-xs font-poppins"
            >
              {isAnalyzing ? (
                <>
                  <Search className="w-4 h-4 animate-spin text-accent" />
                  <span>{t.diagnosingText}</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-accent" />
                  <span>{t.detectBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* History Scan List */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-xs text-gray-800 dark:text-slate-200 uppercase tracking-wider font-poppins">
              {t.historyTitle}
            </h3>
            {history.length > 0 ? (
              <div className="flex flex-col gap-3.5 max-h-60 overflow-y-auto">
                {history.map((h) => (
                  <div 
                    key={h.id} 
                    onClick={() => handleSelectHistoryItem(h)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-850 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-slate-800/80 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      🍂
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{h.diseaseName}</p>
                      <p className="text-[9px] text-gray-400 truncate">{h.crop} • {new Date(h.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 text-center py-4">No previous leaf scans found.</p>
            )}
          </div>
        </div>

        {/* Diagnosis Results (Takes 3/5 width) */}
        <div className="lg:col-span-3">
          {diagnosis ? (
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-float">
              {/* Heading Result Title */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{t.diagnosisResult}</span>
                    {diagnosis.datasetLabel && (
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-bold">
                        {diagnosis.datasetLabel}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-poppins">
                    {diagnosis.crop} - {diagnosis.diseaseName}
                  </h2>
                </div>
                <div className="flex items-center gap-1 bg-danger/10 text-danger border border-danger/15 rounded-full px-3 py-1 text-[10px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{diagnosis.confidence}% Match</span>
                </div>
              </div>

              {/* Cause info */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.diseaseCause}</span>
                <p className="text-xs text-gray-700 dark:text-slate-350 leading-relaxed font-semibold">
                  {diagnosis.cause}
                </p>
              </div>

              {/* Symptoms */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t.symptoms}</span>
                <ul className="flex flex-col gap-1.5">
                  {diagnosis.symptoms?.map((sym, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs text-gray-500 dark:text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-danger shrink-0 mt-1.5" />
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Organic Remediation */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl p-4 flex gap-3.5 text-left">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {t.orgTreatment}
                  </span>
                  <p className="text-xs text-gray-650 dark:text-slate-350 leading-relaxed font-medium">
                    {diagnosis.organicTreatment}
                  </p>
                </div>
              </div>

              {/* Chemical Remediation */}
              <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/20 rounded-2xl p-4 flex gap-3.5 text-left">
                <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    {t.chemTreatment}
                  </span>
                  <p className="text-xs text-gray-650 dark:text-slate-350 leading-relaxed font-medium">
                    {diagnosis.chemicalTreatment}
                  </p>
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Prevention Tips
                </span>
                <ul className="flex flex-col gap-1.5">
                  {diagnosis.preventionTips?.map((tip, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs text-gray-500 dark:text-slate-400 leading-normal">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {/* TTS Audio helper button */}
                <button
                  onClick={handleListenRemedies}
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition font-poppins"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-4 h-4 text-accent" />
                      <span>Stop Readout</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-accent" />
                      <span>{t.listenInLang}</span>
                    </>
                  )}
                </button>

                {/* Escalate to RSK */}
                <button
                  onClick={handleEscalateToExpert}
                  disabled={isEscalating || escalated}
                  className={`font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition font-poppins ${
                    escalated 
                      ? 'bg-emerald-550 text-white cursor-default' 
                      : 'bg-indigo-650 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isEscalating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Escalating...</span>
                    </>
                  ) : escalated ? (
                    <span>Escalated ✓</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-accent" />
                      <span>Escalate to Expert</span>
                    </>
                  )}
                </button>

                {/* Send via SMS */}
                <button
                  onClick={handleSendSMS}
                  disabled={smsSent}
                  className={`font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition font-poppins ${
                    smsSent 
                      ? 'bg-blue-550 text-white cursor-default' 
                      : 'bg-emerald-650 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {smsSent ? (
                    <span>SMS Sent ✓</span>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 text-accent" />
                      <span>Send via SMS</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-250 dark:border-slate-800 rounded-3xl p-10 h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="bg-primary/5 p-4 rounded-full">
                <Search className="w-10 h-10 text-primary/40 dark:text-secondary/40" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 font-poppins">Ready for Leaf Diagnosis</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Upload a photo of your affected crop leaf on the left or select a previous record from history to see organic remedies and fungicide dosages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
