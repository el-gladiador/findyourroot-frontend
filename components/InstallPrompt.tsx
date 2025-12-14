'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus, MoreVertical } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    // Don't show if already installed or dismissed
    if (standalone || dismissed) {
      return;
    }

    // For Android/Desktop - use beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS - show instructions after a delay if not installed
    if (ios) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  // iOS Installation Instructions
  if (isIOS) {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-md mx-4 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Install FindYourRoot
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add to your home screen for quick access
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>

          {/* iOS Installation Steps */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Tap the <Share size={16} className="inline text-indigo-600 dark:text-indigo-400" /> Share button
                  <span className="text-xs text-slate-500">(at the bottom or top)</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Scroll and tap <Plus size={16} className="inline text-indigo-600 dark:text-indigo-400" /> "Add to Home Screen"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Tap "Add" to install
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full mt-4 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop Installation Dialog
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] max-w-md mx-4 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Install App
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Install FindYourRoot on your device for quick access and offline use.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 active:scale-95 transform"
              >
                <Download size={16} />
                Install
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
