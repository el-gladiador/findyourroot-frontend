import React from 'react';
import { Info, Github, Twitter, Linkedin } from 'lucide-react';
import { CREATOR_INFO } from '@/lib/data';

const AboutTab = () => (
  <div className="pb-24 pt-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col items-center mb-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 mb-4 shadow-xl shadow-indigo-500/30">
        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
           <img src="/me.jpg" alt="Mohammad Amiri" className="w-full h-full object-cover" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{CREATOR_INFO.name}</h2>
      <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-4">{CREATOR_INFO.role}</p>
      
      <div className="flex gap-4 mb-8">
        {[Github, Twitter, Linkedin].map((Icon, i) => (
          <button key={i} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-slate-700 transition-all">
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>

    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <Info size={20} className="text-indigo-500" />
        About this App
      </h3>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
        {CREATOR_INFO.bio}
      </p>
    </div>

    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
      <h3 className="font-bold text-lg text-indigo-900 dark:text-white mb-2">Why I Built This App</h3>
      <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">
        I always wanted a digital version of our family tree that everyone could view and contribute to. This app helps preserve the memories and stories of past generations and pass them on to future generations. Hope you enjoy it! 🌳
      </p>
    </div>
  </div>
);

export default AboutTab;
