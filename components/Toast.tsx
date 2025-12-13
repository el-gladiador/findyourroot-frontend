'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-500',
      textColor: 'text-rose-700 dark:text-rose-400',
      iconColor: 'text-rose-600 dark:text-rose-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      iconColor: 'text-amber-600 dark:text-amber-400'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300 max-w-md w-full mx-4`}>
      <div className={`${bgColor} ${textColor} border-l-4 ${borderColor} p-4 rounded-xl shadow-lg flex items-start gap-3`}>
        <Icon size={20} className={`${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
