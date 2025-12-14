'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isUpdating) {
          setShowPrompt(true);
        }
      });

      // Check for waiting service worker on mount
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setShowPrompt(true);
        }

        // Listen for new service worker installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowPrompt(true);
              }
            });
          }
        });
      });
    }
  }, [isUpdating]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Send message to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    // Reload the page to get the new version
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 max-w-sm mx-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Update Available
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              A new version of the app is ready. Reload to update?
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Update Now
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowPrompt(false)}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
