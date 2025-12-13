import React from 'react';
import { TreeDeciduous, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  title: string;
  rightAction?: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, rightAction, isDarkMode, toggleTheme }) => (
  <div className="sticky top-0 z-[100] backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
    <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <TreeDeciduous size={18} className="text-white" />
        </div>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {rightAction}
      </div>
    </div>
  </div>
);

export default TopBar;
