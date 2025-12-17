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
  const { toast, showToast, hideToast } = useToast();
  
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const validateAuth = useAppStore((state) => state.validateAuth);
  const settings = useAppStore((state) => state.settings);
  
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

  // Initialize app on mount
  useEffect(() => {
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

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    // Apply current system preference
    document.documentElement.classList.toggle('dark', mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Tab switching with number keys (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const tabs = ['home', 'admin', 'config', 'about'];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
      <>
        <LoginPage onSuccess={() => showToast({ type: 'success', message: 'Welcome back!' })} />
        {toast && <Toast {...toast} onClose={hideToast} />}
      </>
    );
  }

  return (
    <>
      {isLoading && <SplashScreen />}
      
      <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950" style={{ minHeight: '-webkit-fill-available' }}>
        
        {/* Dynamic Top Bar */}
        <TopBar 
          title={getTitle()} 
          showSearch={activeTab === 'home'}
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
