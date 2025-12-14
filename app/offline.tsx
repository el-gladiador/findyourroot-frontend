'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function Offline() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <WifiOff size={48} className="text-slate-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          You're Offline
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Don't worry! You can still browse your family tree with cached data.
        </p>

        <button
          onClick={handleReload}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  );
}
