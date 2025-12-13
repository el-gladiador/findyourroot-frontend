'use client';

import React, { useState } from 'react';
import { Download, Share2, FileJson, FileText, Image as ImageIcon, X } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
  onExport: (format: 'json' | 'csv' | 'pdf') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const formats = [
    { id: 'json', label: 'JSON', icon: FileJson, description: 'Machine-readable data format' },
    { id: 'csv', label: 'CSV', icon: FileText, description: 'Spreadsheet compatible format' },
    { id: 'pdf', label: 'PDF', icon: ImageIcon, description: 'Printable document format' }
  ];

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Download size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Export Family Tree</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id as any)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === format.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedFormat === format.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/40'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    <Icon size={24} className={
                      selectedFormat === format.id
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400'
                    } />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{format.label}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{format.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onExport(selectedFormat);
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
