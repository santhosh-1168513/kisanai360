import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Search, 
  CloudSun, 
  Droplet, 
  Mic, 
  HelpCircle, 
  ShieldAlert, 
  UserCog, 
  User, 
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { translations } from '../utils/translations';

export default function Sidebar({ currentView, setView, currentUser, language }) {
  const t = translations[language] || translations.english;
  
  if (!currentUser) return null;

  const role = currentUser.role || 'farmer';

  // Define sidebar menu options based on role
  const farmerMenu = [
    { id: 'dashboard', label: t.menuDashboard, icon: LayoutDashboard },
    { id: 'crop-rec', label: t.menuCropRec, icon: Sprout },
    { id: 'crop-prices', label: 'Mandi Prices', icon: TrendingUp },
    { id: 'disease-det', label: t.menuDiseaseDet, icon: Search },
    { id: 'weather', label: t.menuWeather, icon: CloudSun },
    { id: 'water', label: t.menuWater, icon: Droplet },
    { id: 'expert', label: t.menuExpert, icon: HelpCircle },
    { id: 'reports', label: t.menuReports, icon: FileText },
    { id: 'profile', label: t.menuProfile, icon: User },
  ];

  const adminMenu = [
    { id: 'admin', label: t.menuAdmin, icon: ShieldAlert },
    { id: 'expert', label: t.menuExpert, icon: HelpCircle }, // Expert view can answer farmer requests
    { id: 'profile', label: t.menuProfile, icon: User },
  ];

  const activeMenu = role === 'farmer' ? farmerMenu : adminMenu;

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-gray-150 dark:border-slate-800 shrink-0 h-[calc(100vh-64px)] transition-colors duration-200 sticky top-16">
      <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
        {activeMenu.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all group ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-650 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-accent' : 'text-gray-450 dark:text-slate-450'
                }`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                isActive ? 'opacity-100 rotate-90' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </button>
          );
        })}
      </div>
      
      {/* Footer Branding */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
        <p className="text-[10px] font-medium text-gray-450 dark:text-slate-550">
          Powered by Gemini 1.5 Flash
        </p>
      </div>
    </aside>
  );
}
