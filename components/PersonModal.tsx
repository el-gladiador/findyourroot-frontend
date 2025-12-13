'use client';

import React from 'react';
import { X, MapPin, Calendar, User, Heart, Phone, Mail, Home } from 'lucide-react';
import { Person } from '@/lib/types';

interface PersonModalProps {
  person: Person;
  onClose: () => void;
}

const PersonModal: React.FC<PersonModalProps> = ({ person, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 duration-500 max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-90 transition-all duration-300 active:scale-95"
            >
              <X size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          
          <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          </div>
          
          <div className="absolute -bottom-16 left-6 animate-in slide-in-from-left-4 duration-700">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-xl opacity-50 animate-pulse"></div>
              <img 
                src={person.avatar} 
                alt={person.name}
                className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{person.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              <Heart size={14} />
              {person.role}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Born</p>
                <p className="text-slate-900 dark:text-white font-medium">{person.birth}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Location</p>
                <p className="text-slate-900 dark:text-white font-medium">{person.location}</p>
              </div>
            </div>

            {person.bio && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">About</p>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{person.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <button className="flex flex-col items-center gap-2 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors">
              <Phone size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Call</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors">
              <Mail size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Email</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors">
              <Home size={20} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Visit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonModal;
