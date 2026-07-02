import React, { useState, useEffect } from 'react';
import { Sprout, Bell, Globe, Sun, Moon, LogOut, User } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Navbar({ 
  currentUser, 
  setView, 
  language, 
  setLanguage, 
  darkMode, 
  setDarkMode, 
  onLogout 
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const t = translations[language] || translations.english;

  const languages = [
    { code: 'english', label: 'English' },
    { code: 'telugu', label: 'తెలుగు (Telugu)' },
    { code: 'hindi', label: 'हिन्दी (Hindi)' },
    { code: 'tamil', label: 'தமிழ் (Tamil)' }
  ];

  useEffect(() => {
    if (!currentUser) return;
    async function fetchAlerts() {
      try {
        const res = await fetch(`/api/weather/alerts?userId=${currentUser.userId}`);
        const data = await res.json();
        if (data.success) {
          setNotifications(data.alerts || []);
          setUnreadCount(data.alerts.length);
        }
      } catch (err) {
        console.error("Failed to load notifications in Navbar:", err);
      }
    }
    fetchAlerts();
    // Poll every 30 seconds for live notifications updates
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="bg-primary/10 dark:bg-primary-dark/20 p-2 rounded-xl">
              <Sprout className="h-6 w-6 text-primary dark:text-secondary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary dark:text-secondary font-poppins">
              {t.title}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800 transition font-medium"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {languages.find(l => l.code === language)?.label.split(' ')[0]}
                </span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-850 shadow-xl ring-1 ring-black/5 dark:ring-white/5 border border-gray-100 dark:border-slate-800 py-1.5 focus:outline-none z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition ${
                        language === lang.code
                          ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-secondary'
                          : 'text-gray-750 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotificationMenu(!showNotificationMenu);
                    setUnreadCount(0); // clear count upon inspection
                  }}
                  className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-danger animate-pulse" />
                  )}
                </button>
                {showNotificationMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-850 shadow-xl border border-gray-100 dark:border-slate-800 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{t.alertsTitle}</span>
                      <button onClick={() => { setView('dashboard'); setShowNotificationMenu(false); }} className="text-[10px] text-primary font-semibold hover:underline">
                        {t.viewAll}
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/40 last:border-b-0 cursor-pointer" 
                            onClick={() => { 
                              setView(n.type === 'expert' ? 'expert' : n.type === 'water' ? 'water' : 'dashboard'); 
                              setShowNotificationMenu(false); 
                            }}
                          >
                            <p className="text-xs text-gray-750 dark:text-slate-300 font-bold leading-tight">{n.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-gray-400 mt-1 block">
                              {n.timestamp ? n.timestamp.split('T')[0] : 'Just now'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-gray-450">
                          No active notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Login CTAs */}
            {currentUser ? (
              <div className="flex items-center gap-3 border-l border-gray-100 dark:border-slate-800 pl-4">
                <div 
                  onClick={() => setView('profile')}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-85"
                >
                  <div className="bg-primary hover:bg-primary-dark text-white p-1.5 rounded-full text-xs font-bold h-8 w-8 flex items-center justify-center shadow-md">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{currentUser.role}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition"
                  title={t.logout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('login')}
                  className="text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-secondary px-3 py-2 transition"
                >
                  {t.navLogin}
                </button>
                <button
                  onClick={() => setView('register')}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition"
                >
                  {t.getStarted}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
