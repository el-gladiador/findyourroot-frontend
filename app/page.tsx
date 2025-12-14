'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import BottomNavigation from '@/components/BottomNavigation';
import TreeTab from '@/components/tabs/TreeTab';
import SearchTab from '@/components/tabs/SearchTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import AboutTab from '@/components/tabs/AboutTab';
import AdminTab from '@/components/tabs/AdminTab';
import Toast from '@/components/Toast';
import SplashScreen from '@/components/SplashScreen';
import UpdatePrompt from '@/components/UpdatePrompt';
import InstallPrompt from '@/components/InstallPrompt';
import LoginPage from '@/components/LoginPage';
import { useToast } from '@/lib/hooks';
import { useAppStore } from '@/lib/store';
import { useRealtimeSync } from '@/lib/realtime-sync';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const validateAuth = useAppStore((state) => state.validateAuth);
  
  // Enable real-time sync (Firestore listeners or polling)
  useRealtimeSync();

  // Validate authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecking(true);
      await validateAuth();
      setIsAuthChecking(false);
    };
    
    checkAuth();
  }, [validateAuth]);

  // Periodic user validation to detect role changes (e.g., admin approval)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const intervalId = setInterval(async () => {
      console.log('[Auth] Checking for role updates...');
      await validateAuth();
    }, 15000); // Check every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, validateAuth]);

  // Validate on tab visibility change (user returns to app)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Tab visible, checking for role updates...');
        await validateAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, validateAuth]);

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

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Hide splash screen after delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Persist theme changes and apply to document
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply dark class to html element for Tailwind
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
      case 'admin': return <AdminTab />;
      case 'config': return <SettingsTab />;
      case 'about': return <AboutTab />;
      default: return <TreeTab />;
    }
  };

  const getTitle = () => {
    switch(activeTab) {
      case 'home': return 'The Pendelton Line';
      case 'search': return 'Find Relative';
      case 'admin': return 'Admin Panel';
      case 'config': return 'Configuration';
      case 'about': return 'About Creator';
      default: return 'App';
    }
  };

  // Show loading during auth check
  if (isAuthChecking) {
    return <SplashScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <LoginPage onSuccess={() => showToast({ type: 'success', message: 'Welcome back!' })} />
        {toast && <Toast {...toast} onClose={hideToast} />}
      </div>
    );
  }

  return (
    <>
      {isLoading && <SplashScreen />}
      
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`} style={{ minHeight: '-webkit-fill-available' }}>
        
        {/* Dynamic Top Bar */}
        <TopBar 
          title={getTitle()} 
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        {/* Main Content Area */}
        <main 
          className={`min-h-screen bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative ${activeTab === 'home' ? 'w-full' : 'max-w-md mx-auto border-x border-slate-200 dark:border-slate-800'}`}
        >
          <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={activeTab}>
            {renderContent()}
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Toast Notifications */}
        {toast && <Toast {...toast} onClose={hideToast} />}

        {/* PWA Features */}
        <UpdatePrompt />
        <InstallPrompt />
      </div>
    </>
  );
}
