import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import VoiceWidget from './VoiceWidget';
import { LayoutDashboard, Sprout, Search, CloudSun, Droplet, HelpCircle, ShieldAlert, User } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Layout({ 
  children, 
  currentView, 
  setView, 
  currentUser, 
  language, 
  setLanguage, 
  darkMode, 
  setDarkMode, 
  onLogout 
}) {
  const t = translations[language] || translations.english;

  // Mobile Bottom Navigation Bar (for small screens)
  const renderMobileNav = () => {
    if (!currentUser) return null;
    
    const role = currentUser.role || 'farmer';
    
    const farmerMobileMenu = [
      { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
      { id: 'crop-rec', label: 'Crop', icon: Sprout },
      { id: 'disease-det', label: 'Scan', icon: Search },
      { id: 'weather', label: 'Weather', icon: CloudSun },
      { id: 'expert', label: 'Expert', icon: HelpCircle }
    ];

    const adminMobileMenu = [
      { id: 'admin', label: 'Admin', icon: ShieldAlert },
      { id: 'expert', label: 'RSK', icon: HelpCircle },
      { id: 'profile', label: 'Profile', icon: User }
    ];

    const activeMobileMenu = role === 'farmer' ? farmerMobileMenu : adminMobileMenu;

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800 flex justify-around items-center py-2 z-40 shadow-lg">
        {activeMobileMenu.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-primary dark:text-secondary' 
                  : 'text-gray-400 dark:text-slate-450'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <Navbar 
        currentUser={currentUser} 
        setView={setView} 
        language={language} 
        setLanguage={setLanguage} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onLogout={onLogout} 
      />
      
      <div className="flex flex-1 relative">
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
          currentUser={currentUser} 
          language={language} 
        />
        
        <main className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-24 md:pb-8 ${currentUser ? 'w-[calc(100vw-256px)]' : 'w-full'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Voice Assistant (Available to logged in users) */}
      {currentUser && (
        <VoiceWidget language={language} userId={currentUser.userId} />
      )}

      {/* Mobile Bottom Navigation Bar */}
      {renderMobileNav()}
    </div>
  );
}
