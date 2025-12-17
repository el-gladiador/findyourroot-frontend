import React, { useState, useEffect, useRef } from 'react';
import { TreeDeciduous, Sun, Moon, Search, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ApiClient } from '@/lib/api';

interface TopBarProps {
  title: string;
  rightAction?: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  showSearch?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ title, rightAction, isDarkMode, toggleTheme, showSearch = false }) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const setFocusedPersonId = useAppStore((state) => state.setFocusedPersonId);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchInput.trim()) {
      setFocusedPersonId(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await ApiClient.searchPeople({
          q: searchInput,
          page: 1,
          pageSize: 1,
        });

        if (response.data && response.data.data.length > 0) {
          setFocusedPersonId(response.data.data[0].id);
        } else {
          setFocusedPersonId(null);
        }
      } catch (error) {
        console.error('[Search] Error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput, setFocusedPersonId]);

  const toggleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchInput('');
      setFocusedPersonId(null);
    }
  };

  return (
    <div className="sticky top-0 z-[100] backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left side - Logo and title (hide when search expanded) */}
        {!searchExpanded && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <TreeDeciduous size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight truncate">{title}</h1>
          </div>
        )}
        
        {/* Search bar (show on tree tab) */}
        {showSearch && (
          <div className={`flex items-center gap-2 ${searchExpanded ? 'flex-1' : ''}`}>
            {searchExpanded && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search family member..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-500" />
                )}
              </div>
            )}
            <button
              onClick={toggleSearchExpanded}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {searchExpanded ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        )}
        
        {/* Right side - Theme toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {rightAction}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
