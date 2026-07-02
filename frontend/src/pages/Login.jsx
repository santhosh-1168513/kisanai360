import React, { useState } from 'react';
import { Sprout, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { translations } from '../utils/translations';
import { auth, isFirebaseConfigured } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ setView, setCurrentUser, language }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const t = translations[language] || translations.english;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let firebaseUid = null;
      
      // Perform Firebase Auth Sign-in if configured
      if (isFirebaseConfigured) {
        const email = phone.includes('@') ? phone : phone.replace(/[^0-9]/g, '') + "@kisanai360.com";
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          firebaseUid = userCredential.user.uid;
        } catch (fbErr) {
          console.error("Firebase Auth failed, trying local fallback:", fbErr);
          setError("Firebase Auth failed: " + (fbErr.message || "Invalid credentials"));
          setIsLoading(false);
          return;
        }
      }

      // Synchronize session details with Flask backend
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          password,
          userId: firebaseUid
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
        setError(data.error || "Login failed. Check your credentials.");
      }
    } catch (err) {
      setError("Cannot connect to backend. Please make sure the Flask server is running.");
    } finally {
      setIsLoading(false);
    }
  };


  // Quick log in handler for hackathon demo convenience
  const handleQuickLogin = (role) => {
    if (role === 'farmer') {
      setPhone('+91 98765 43210');
      setPassword('password');
    } else if (role === 'expert') {
      setPhone('+91 88888 88888');
      setPassword('password');
    } else if (role === 'admin') {
      setPhone('+91 99999 99999');
      setPassword('admin');
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">Welcome Back!</h2>
          <p className="text-xs text-gray-400">Log in to manage your smart farm advisory.</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger text-xs font-semibold p-3.5 rounded-xl text-left border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400">Password</label>
              <button 
                type="button"
                onClick={() => alert("Try using one of the Quick Login options below!")}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary transition dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition mt-2 text-sm"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Login</span>
          </button>
        </form>


        <p className="text-xs text-gray-450 dark:text-slate-400">
          Don't have an account?{" "}
          <button 
            onClick={() => setView('register')} 
            className="text-primary font-bold hover:underline"
          >
            Register here
          </button>
        </p>

        {/* Quick Demo Logins */}
        <div className="border-t border-gray-100 dark:border-slate-800 pt-5 mt-2">
          <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-3">
            Quick Login For Evaluation
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('farmer')}
              className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-lg py-1.5 px-1 text-[10px] font-bold hover:opacity-80 transition"
            >
              Farmer Profile
            </button>
            <button
              onClick={() => handleQuickLogin('expert')}
              className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-lg py-1.5 px-1 text-[10px] font-bold hover:opacity-80 transition"
            >
              Expert Profile
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="bg-amber-50 dark:bg-amber-950/20 text-accent-dark dark:text-accent border border-amber-100 dark:border-amber-900/40 rounded-lg py-1.5 px-1 text-[10px] font-bold hover:opacity-80 transition"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
