import React, { useState } from 'react';
import { Sprout, Phone, Lock, User, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { translations } from '../utils/translations';
import { auth, isFirebaseConfigured } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Register({ setView, setCurrentUser, language }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer'); // farmer, expert
  const [prefLanguage, setPrefLanguage] = useState('english');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const t = translations[language] || translations.english;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let firebaseUid = null;

      // Register with Firebase Auth if configuration is active
      if (isFirebaseConfigured) {
        const email = phone.includes('@') ? phone : phone.replace(/[^0-9]/g, '') + "@kisanai360.com";
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          firebaseUid = userCredential.user.uid;
        } catch (fbErr) {
          console.error("Firebase Registration failed, aborting:", fbErr);
          if (fbErr.code === 'auth/email-already-in-use') {
            setError("This mobile number/email is already registered. Please click 'Log in here' below to sign in.");
          } else {
            setError("Firebase Registration failed: " + (fbErr.message || "Could not register account."));
          }
          setIsLoading(false);
          return;
        }
      }

      // Sync and register profile in Flask SQLite backend
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: firebaseUid,
          name, 
          phone, 
          password, 
          role, 
          language: prefLanguage 
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        if (data.user.role === 'farmer') {
          setView('dashboard');
        } else {
          setView('admin');
        }
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      setError("Cannot connect to backend. Please ensure the Flask server is running.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6 text-center">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-primary/10 p-3 rounded-full w-fit">
            <Sprout className="h-8 w-8 text-primary dark:text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">Join KisanAI 360</h2>
          <p className="text-xs text-gray-400">Create your account to get expert agricultural tips.</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-xs font-semibold p-3.5 rounded-xl text-left border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition dark:text-white"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="pl-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition dark:text-white"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition dark:text-white"
              />
            </div>
          </div>

          {/* Account Role Selection */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <label className={`border rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition ${
              role === 'farmer' 
                ? 'border-primary bg-primary/5 text-primary dark:border-secondary dark:bg-secondary/5 dark:text-secondary' 
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
            }`}>
              <input 
                type="radio" 
                name="role" 
                value="farmer" 
                checked={role === 'farmer'} 
                onChange={() => setRole('farmer')}
                className="sr-only"
              />
              <span className="text-xs font-bold">Farmer Profile</span>
              <span className="text-[10px] text-gray-400">Get crop disease & weather advice</span>
            </label>
            <label className={`border rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition ${
              role === 'expert' 
                ? 'border-primary bg-primary/5 text-primary dark:border-secondary dark:bg-secondary/5 dark:text-secondary' 
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
            }`}>
              <input 
                type="radio" 
                name="role" 
                value="expert" 
                checked={role === 'expert'} 
                onChange={() => setRole('expert')}
                className="sr-only"
              />
              <span className="text-xs font-bold">RSK Expert</span>
              <span className="text-[10px] text-gray-400">Review & reply to farmer requests</span>
            </label>
          </div>

          {/* Select Preferred Language */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Preferred Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <select
                value={prefLanguage}
                onChange={(e) => setPrefLanguage(e.target.value)}
                className="pl-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition dark:text-white appearance-none cursor-pointer"
              >
                <option value="english">English</option>
                <option value="telugu">తెలుగు (Telugu)</option>
                <option value="hindi">हिन्दी (Hindi)</option>
                <option value="tamil">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition mt-2 text-sm"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign Up</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


        <p className="text-xs text-gray-450 dark:text-slate-400">
          Already have an account?{" "}
          <button 
            onClick={() => setView('login')} 
            className="text-primary font-bold hover:underline"
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}
