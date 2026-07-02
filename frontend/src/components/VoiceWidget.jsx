import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Send, CornerDownLeft } from 'lucide-react';
import { translations } from '../utils/translations';

export default function VoiceWidget({ language, userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'bot',
      text: language === 'telugu' 
        ? "నమస్కారం! నేను కిసాన్AI సహాయకుడిని. నేను మీకు ఎలా సహాయపడగలను?" 
        : language === 'hindi'
        ? "नमस्ते! मैं किसानAI सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?"
        : language === 'tamil'
        ? "வணக்கம்! நான் கிசான்AI உதவியாளர். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
        : "Hello! I am your KisanAI Assistant. How can I help you today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const t = translations[language] || translations.english;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Map app language to speech locale
      const localeMap = {
        telugu: 'te-IN',
        hindi: 'hi-IN',
        tamil: 'ta-IN',
        english: 'en-IN'
      };
      rec.lang = localeMap[language] || 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          alert("Microphone permission denied. Please allow microphone access in your browser settings to use the Voice Assistant.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  // TTS Readout
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    // Cancel ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    const localeMap = {
      telugu: 'te-IN',
      hindi: 'hi-IN',
      tamil: 'ta-IN',
      english: 'en-IN'
    };
    utterance.lang = localeMap[language] || 'en-IN';
    
    // Force voice matching with async voiceschanged compatibility
    let voices = window.speechSynthesis.getVoices();
    const findVoice = () => {
      return voices.find(v => v.lang.toLowerCase().includes(utterance.lang.toLowerCase()) || 
                           v.lang.toLowerCase().startsWith(utterance.lang.substring(0, 2).toLowerCase()));
    };
    
    const matchedVoice = findVoice();
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      // If voices are empty (not loaded yet by browser), bind to voiceschanged event
      window.speechSynthesis.onvoiceschanged = () => {
        const reloadedVoices = window.speechSynthesis.getVoices();
        const secondAttemptVoice = reloadedVoices.find(v => v.lang.toLowerCase().includes(utterance.lang.toLowerCase()) || 
                                                     v.lang.toLowerCase().startsWith(utterance.lang.substring(0, 2).toLowerCase()));
        if (secondAttemptVoice) {
          utterance.voice = secondAttemptVoice;
        }
        window.speechSynthesis.speak(utterance);
      };
      // Trigger a speak block in case voiceschanged never fires
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop talking when starting to listen
      recognitionRef.current.start();
    }
  };

  const handleUserMessage = async (text) => {
    if (!text || text.trim() === '') return;
    
    // Add user message to history
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setIsThinking(true);

    try {
      // Query backend voice assistant API
      const res = await fetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query: text, language })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setChatHistory(prev => [...prev, { sender: 'bot', text: data.response }]);
        // Speak response out loud
        speakText(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      const errMsg = language === 'telugu' 
        ? "క్షమించండి, సర్వర్ కనెక్ట్ కావడంలో సమస్య వచ్చింది."
        : "Sorry, there was an issue connecting to the server.";
      setChatHistory(prev => [...prev, { sender: 'bot', text: errMsg }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-inter">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white p-4 rounded-full shadow-2xl flex items-center justify-center animate-bounce duration-1000 transition-all hover:scale-110"
          title={t.menuVoice}
        >
          <Mic className="w-6 h-6 animate-pulse-slow" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-primary dark:bg-slate-850 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-full">
                <Mic className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{t.menuVoice}</h3>
                <p className="text-[10px] text-primary-light">Gemini AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="hover:bg-white/10 p-1.5 rounded-lg transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsOpen(false);
                }} 
                className="hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Bubble Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950/40 flex flex-col gap-3">
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  chat.sender === 'user'
                    ? 'bg-primary text-white ml-auto rounded-tr-none'
                    : 'bg-white dark:bg-slate-850 text-gray-800 dark:text-slate-200 mr-auto rounded-tl-none border border-gray-100 dark:border-slate-800/60 shadow-sm'
                }`}
              >
                {chat.text}
              </div>
            ))}
            
            {isThinking && (
              <div className="bg-white dark:bg-slate-850 text-gray-400 mr-auto rounded-2xl rounded-tl-none p-3 border border-gray-100 dark:border-slate-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Voice Prompt Helper Hint */}
          <div className="px-4 py-1.5 bg-accent-light/40 text-accent-dark text-[10px] text-center border-t border-b border-accent/20">
            {t.voicePromptExample}
          </div>

          {/* Input Panel */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-full shadow-md flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-danger text-white animate-pulse' 
                  : 'bg-primary-light hover:bg-primary-light/80 text-primary dark:bg-slate-800 dark:text-slate-300'
              }`}
              title={isListening ? "Stop Listening" : "Start Speaking"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleUserMessage(inputText);
              }}
              className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 border border-transparent focus-within:border-primary/20 focus-within:bg-white dark:focus-within:bg-slate-850 transition"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? t.listening : "Ask KisanAI..."}
                disabled={isListening}
                className="flex-1 bg-transparent border-none text-xs focus:ring-0 outline-none text-gray-700 dark:text-slate-350 pr-2"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="text-primary disabled:text-gray-300 dark:disabled:text-slate-650 hover:scale-105 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
