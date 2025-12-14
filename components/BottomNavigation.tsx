import React from 'react';
import { TreeDeciduous, Search, Settings, Info } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: TreeDeciduous, label: 'Tree' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'config', icon: Settings, label: 'Config' },
    { id: 'about', icon: Info, label: 'About' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg safe-area-bottom">
      <div className="max-w-md mx-auto border-t border-slate-200 dark:border-slate-800">
        {/* Glassmorphism Container */}
        <div className="pt-2 px-6">
          <div className="flex items-center justify-between h-16">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center gap-1 w-16 h-full group"
                >
                  {/* Active Indicator Background */}
                  {isActive && (
                    <span className="absolute -top-2 w-12 h-1 bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300" />
                  )}
                  
                  <div className={`
                    relative p-1.5 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 -translate-y-1' 
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }
                  `}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <span className={`text-[10px] font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 opacity-100 translate-y-0' 
                      : 'text-slate-400 opacity-0 translate-y-2 absolute'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
