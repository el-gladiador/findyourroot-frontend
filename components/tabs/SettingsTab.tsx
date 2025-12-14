import React, { useState, useEffect } from 'react';
import { Bell, Shield, Smartphone, ChevronRight, Download, Share2, LogOut } from 'lucide-react';
import ExportModal from '@/components/ExportModal';
import { useAppStore } from '@/lib/store';
import { exportToJSON, exportToCSV, exportToPDF, shareData } from '@/lib/export';

const SettingsTab = () => {
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [offlineAccess, setOfflineAccess] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const familyData = useAppStore((state) => state.familyData);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  // Load settings from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    const savedPrivacy = localStorage.getItem('privacyMode');
    const savedOffline = localStorage.getItem('offlineAccess');
    
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedPrivacy !== null) setPrivacyMode(savedPrivacy === 'true');
    if (savedOffline !== null) setOfflineAccess(savedOffline === 'true');
  }, []);

  // Save settings to localStorage
  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', String(newValue));
  };

  const handlePrivacyToggle = () => {
    const newValue = !privacyMode;
    setPrivacyMode(newValue);
    localStorage.setItem('privacyMode', String(newValue));
  };

  const handleOfflineToggle = () => {
    const newValue = !offlineAccess;
    setOfflineAccess(newValue);
    localStorage.setItem('offlineAccess', String(newValue));
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    switch (format) {
      case 'json':
        exportToJSON(familyData);
        break;
      case 'csv':
        exportToCSV(familyData);
        break;
      case 'pdf':
        exportToPDF(familyData);
        break;
    }
  };

  const handleShare = async () => {
    const shared = await shareData(
      'My Family Tree',
      `Check out my family tree with ${familyData.length} members!`,
      window.location.href
    );
  };
  
  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">App Settings</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Notifications</span>
              </div>
              <button 
                onClick={handleNotificationsToggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${notifications ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifications ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Privacy Mode</span>
              </div>
              <button 
                onClick={handlePrivacyToggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${privacyMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${privacyMode ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Offline Access</span>
              </div>
              <button 
                onClick={handleOfflineToggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${offlineAccess ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${offlineAccess ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Data Management</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <button 
              onClick={() => setShowExportModal(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Download size={16} />
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Export Data</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            <button 
              onClick={handleShare}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Share Tree</span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Account</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {user?.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{user?.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <LogOut size={16} />
                </div>
                <span className="font-medium text-rose-500">Sign Out</span>
              </div>
            </button>
          </div>
        </section>
        
        <p className="text-center text-xs text-slate-400 py-4">Version 2.4.0 (Build 2024)</p>

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal 
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
