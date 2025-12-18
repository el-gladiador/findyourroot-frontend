'use client';

import React from 'react';
import { AlertTriangle, UserCheck, UserPlus, X, FileText } from 'lucide-react';

interface DuplicateMatch {
  person_id: string;
  name: string;
  similarity: number;
  match_type: string;
}

interface DuplicateWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inputName: string;
  matches: DuplicateMatch[];
  isAdmin: boolean;
  onAddAnyway: () => void;
  onSubmitSuggestion: () => void;
  onCancel: () => void;
}

const getMatchTypeLabel = (matchType: string): string => {
  switch (matchType) {
    case 'exact':
      return 'تطابق کامل';
    case 'normalized':
      return 'نام مشابه';
    case 'similar':
      return 'شباهت زیاد';
    case 'ai':
      return 'تشخیص هوشمند';
    default:
      return 'مشابه';
  }
};

const getSimilarityColor = (similarity: number): string => {
  if (similarity >= 0.95) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  if (similarity >= 0.85) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
  return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
};

const DuplicateWarningDialog: React.FC<DuplicateWarningDialogProps> = ({
  isOpen,
  onClose,
  inputName,
  matches,
  isAdmin,
  onAddAnyway,
  onSubmitSuggestion,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-md mx-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              احتمال وجود نام مشابه
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Possible Duplicate Detected
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            نام <span className="font-bold text-slate-900 dark:text-white">&ldquo;{inputName}&rdquo;</span> با نام‌های زیر در درخت خانواده شباهت دارد:
          </p>

          {/* Matches List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {matches.map((match) => (
              <div 
                key={match.person_id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white" dir="rtl">
                      {match.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {getMatchTypeLabel(match.match_type)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSimilarityColor(match.similarity)}`}>
                  {Math.round(match.similarity * 100)}%
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
            <p className="font-medium">💡 توجه</p>
            <p className="text-xs mt-1 opacity-80">
              {isAdmin 
                ? 'به عنوان مدیر می‌توانید این نام را با وجود شباهت اضافه کنید.'
                : 'می‌توانید درخواست خود را برای بررسی مدیر ارسال کنید.'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            انصراف
          </button>
          
          {isAdmin ? (
            <button
              onClick={onAddAnyway}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <UserPlus size={18} />
              افزودن
            </button>
          ) : (
            <button
              onClick={onSubmitSuggestion}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              <FileText size={18} />
              ارسال پیشنهاد
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarningDialog;
