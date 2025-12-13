'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import BottomNavigation from '@/components/BottomNavigation';
import TreeTab from '@/components/tabs/TreeTab';
import SearchTab from '@/components/tabs/SearchTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import AboutTab from '@/components/tabs/AboutTab';
import Toast from '@/components/Toast';
import { useToast } from '@/lib/hooks';
import { useSwipe } from '@/lib/swipe-hooks';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tabs = ['home', 'search', 'config', 'about'];
  
  const handleSwipeLeft = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const swipeHandlers = useSwipe(handleSwipeLeft, handleSwipeRight);

  // Handle system preference and localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Persist theme changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Tab switching with number keys (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const tabs = ['home', 'search', 'config', 'about'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
      
      // Theme toggle with 't' key
      if (e.key === 't' || e.key === 'T') {
        setIsDarkMode(prev => !prev);
        showToast({ 
          type: 'info', 
          message: `Theme switched to ${!isDarkMode ? 'dark' : 'light'} mode` 
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDarkMode, showToast]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    showToast({ 
      type: 'success', 
      message: `Theme switched to ${!isDarkMode ? 'dark' : 'light'} mode` 
    });
  };

  // Render logic
  const renderContent = () => {
    switch(activeTab) {
      case 'home': return <TreeTab />;
      case 'search': return <SearchTab />;
      case 'config': return <SettingsTab />;
      case 'about': return <AboutTab />;
      default: return <TreeTab />;
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'home': return 'The Pendelton Line';
      case 'search': return 'Find Relative';
      case 'config': return 'Configuration';
      case 'about': return 'About Creator';
      default: return 'App';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Dynamic Top Bar */}
      <TopBar 
        title={getTitle()} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area - Scrollable with Swipe Support */}
      <main 
        className="max-w-md mx-auto min-h-screen bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative border-x border-slate-200 dark:border-slate-800"
        {...swipeHandlers}
      >
        <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={activeTab}>
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Toast Notifications */}
      {toast && <Toast {...toast} onClose={hideToast} />}
    </div>
  );
}
