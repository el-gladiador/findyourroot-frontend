'use client';

import React, { useState, useEffect } from 'react';
import { TreeDeciduous } from 'lucide-react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center animate-in fade-in duration-300">
      <div className="text-center animate-in zoom-in duration-500">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl animate-pulse">
            <TreeDeciduous size={48} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-white/10 animate-ping" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-4 duration-700 delay-300">
          FindYourRoot
        </h1>
        <p className="text-white/80 text-sm animate-in slide-in-from-bottom-4 duration-700 delay-500">
          Discover Your Family Tree
        </p>

        {/* Loading Bar */}
        <div className="mt-8 w-48 h-1 mx-auto bg-white/20 rounded-full overflow-hidden animate-in fade-in duration-700 delay-700">
          <div className="h-full bg-white rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{
            animation: 'loading 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 50%;
            margin-left: 25%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
