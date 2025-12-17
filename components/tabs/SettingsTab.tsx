import React, { useState, useEffect } from 'react';
import { Bell, Shield, Smartphone, ChevronRight, Download, Share2, LogOut, UserPlus, Loader2, UserCheck, Sun, Moon, Monitor } from 'lucide-react';
import ExportModal from '@/components/ExportModal';
import IdentityClaimModal from '@/components/IdentityClaimModal';
import { useAppStore } from '@/lib/store';
import { shareData } from '@/lib/export';
import { ApiClient } from '@/lib/api';

const SettingsTab = () => {
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [offlineAccess, setOfflineAccess] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestRole, setRequestRole] = useState<'editor' | 'admin'>('editor');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const familyData = useAppStore((state) => state.familyData);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    };
    
    applyTheme(settings.theme);
    
    // Listen for system theme changes when in system mode
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    localStorage.setItem('theme', theme);
  };

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

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'json':
          await ApiClient.exportJSON();
          break;
        case 'csv':
          await ApiClient.exportCSV();
          break;
        case 'pdf':
          // Backend provides text export (PDF generation could be added later)
          await ApiClient.exportText();
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
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

  const handleRequestPermission = async () => {
    setRequestStatus('loading');
    const response = await ApiClient.requestPermission(requestRole, requestMessage);
    
    if (response.error) {
      setRequestStatus('error');
      setStatusMessage(response.error);
    } else {
      setRequestStatus('success');
      setStatusMessage('Permission request sent! An administrator will review your request.');
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestStatus('idle');
        setRequestMessage('');
      }, 2000);
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Appearance</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  {settings.theme === 'dark' ? <Moon size={16} /> : settings.theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
                </div>
                <span className="font-medium text-slate-800 dark:text-white">Theme</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.theme === 'light'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Sun size={16} />
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Moon size={16} />
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.theme === 'system'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Monitor size={16} />
                  Auto
                </button>
              </div>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {user?.role || 'viewer'}
                    {user?.role === 'admin' && ' (Full Access)'}
                    {user?.role === 'editor' && ' (Can Edit)'}
                    {user?.role === 'viewer' && ' (View Only)'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Claim Identity Button - Show for all users */}
            <button 
              onClick={() => setShowIdentityModal(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  user?.person_id 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-white block">
                    {user?.person_id ? 'My Tree Identity' : 'Claim My Identity'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.person_id ? 'Linked to family tree' : 'Link your profile to the tree'}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
            
            {/* Request Permissions Button - Only show for viewers */}
            {user?.role === 'viewer' && (
              <button 
                onClick={() => setShowRequestModal(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <span className="font-medium text-slate-800 dark:text-white block">Request Permissions</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ask admin for edit access</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            )}
            
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

        {/* Request Permission Modal */}
        {showRequestModal && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowRequestModal(false)}
          >
            <div 
              className="bg-white dark:bg-slate-800 w-full max-w-md mx-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Request Permissions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ask the administrator for elevated access</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Permission Level
                  </label>
                  <select
                    value={requestRole}
                    onChange={(e) => setRequestRole(e.target.value as 'editor' | 'admin')}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="editor">Editor (Can add/edit people)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Why do you need this permission?"
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {statusMessage && (
                  <div className={`p-3 rounded-lg ${
                    requestStatus === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  }`}>
                    <p className="text-sm">{statusMessage}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestStatus('idle');
                    setStatusMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPermission}
                  disabled={requestStatus === 'loading'}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestStatus === 'loading' ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Identity Claim Modal */}
        {showIdentityModal && (
          <IdentityClaimModal onClose={() => setShowIdentityModal(false)} />
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
