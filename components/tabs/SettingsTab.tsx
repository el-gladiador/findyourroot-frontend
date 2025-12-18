import React, { useState, useEffect, useMemo } from 'react';
import { Bell, ChevronRight, Download, Share2, LogOut, UserPlus, UserCheck, Wifi, WifiOff, Cloud, Globe } from 'lucide-react';
import ExportModal from '@/components/ExportModal';
import IdentityClaimModal from '@/components/IdentityClaimModal';
import { useAppStore } from '@/lib/store';
import { shareData } from '@/lib/export';
import { ApiClient } from '@/lib/api';
import { UserRole, getRoleLabel, getRoleDescription } from '@/lib/types';
import { 
  isOnline, 
  getQueuedActions, 
  requestNotificationPermission, 
  getNotificationPermission,
  showNotification 
} from '@/lib/offline-sync';
import { useI18n, LANGUAGES, Language } from '@/lib/i18n';

// Role hierarchy for determining upgrade options
const ROLE_HIERARCHY: UserRole[] = ['viewer', 'contributor', 'editor', 'co-admin', 'admin'];

const SettingsTab = () => {
  const { t, language, setLanguage } = useI18n();
  const [notifications, setNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [offlineAccess, setOfflineAccess] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestRole, setRequestRole] = useState<UserRole>('contributor');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const familyData = useAppStore((state) => state.familyData);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  
  const isAdmin = user?.role === 'admin';
  
  // Get roles higher than current user's role
  const availableUpgrades = useMemo(() => {
    const currentRole = user?.role || 'viewer';
    const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
    // Return all roles higher than current (excluding admin request by non-co-admins for simplicity)
    return ROLE_HIERARCHY.slice(currentIndex + 1);
  }, [user?.role]);
  
  // Set default request role to next level up
  useEffect(() => {
    if (availableUpgrades.length > 0 && !availableUpgrades.includes(requestRole)) {
      setRequestRole(availableUpgrades[0]);
    }
  }, [availableUpgrades, requestRole]);

  // Load settings from localStorage and check permissions
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    const savedOffline = localStorage.getItem('offlineAccess');
    
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedOffline !== null) setOfflineAccess(savedOffline === 'true');
    
    // Check notification permission
    setNotificationPermission(getNotificationPermission());
    
    // Check online status
    setOnlineStatus(isOnline());
    
    // Check pending actions
    setPendingActions(getQueuedActions().length);
    
    // Listen for online/offline changes
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    const handleQueueUpdate = (e: CustomEvent) => setPendingActions(e.detail);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offlineQueueUpdate', handleQueueUpdate as EventListener);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineQueueUpdate', handleQueueUpdate as EventListener);
    };
  }, []);

  // Handle notifications toggle
  const handleNotificationsToggle = async () => {
    if (!notifications) {
      // Turning on - request permission first
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifications(true);
        setNotificationPermission('granted');
        localStorage.setItem('notifications', 'true');
        
        // Show test notification
        showNotification('Notifications Enabled', {
          body: 'You will now receive updates about your family tree.',
        });
      } else {
        setNotificationPermission(getNotificationPermission());
        // Permission denied - show message
        alert('Please allow notifications in your browser settings to enable this feature.');
      }
    } else {
      // Turning off
      setNotifications(false);
      localStorage.setItem('notifications', 'false');
    }
  };

  const handleOfflineToggle = () => {
    const newValue = !offlineAccess;
    setOfflineAccess(newValue);
    localStorage.setItem('offlineAccess', String(newValue));
    
    if (newValue) {
      // Enable offline - register service worker if not already
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('Service worker registration failed:', err);
        });
      }
    }
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
    <div className="pb-32 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        {/* Connection Status Banner */}
        {!onlineStatus && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <WifiOff size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">You're offline</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {pendingActions > 0 
                  ? `${pendingActions} action${pendingActions > 1 ? 's' : ''} will sync when you're back online`
                  : 'Changes will be saved when you reconnect'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Pending Sync Banner */}
        {onlineStatus && pendingActions > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Cloud size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Syncing changes...</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {pendingActions} action{pendingActions > 1 ? 's' : ''} pending
              </p>
            </div>
          </div>
        )}

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">App Settings</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            {/* Notifications */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-white block">Notifications</span>
                  {notificationPermission === 'denied' && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">Blocked - enable in browser settings</span>
                  )}
                  {notificationPermission === 'default' && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Tap to enable</span>
                  )}
                  {notificationPermission === 'granted' && notifications && (
                    <span className="text-xs text-green-600 dark:text-green-400">Enabled</span>
                  )}
                  {notificationPermission === 'granted' && !notifications && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Disabled</span>
                  )}
                  {notificationPermission === 'unsupported' && (
                    <span className="text-xs text-slate-500">Not supported in this browser</span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleNotificationsToggle}
                disabled={notificationPermission === 'unsupported'}
                className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  notifications && notificationPermission !== 'denied' && notificationPermission !== 'unsupported'
                    ? 'bg-indigo-500' 
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  notifications && notificationPermission !== 'denied' && notificationPermission !== 'unsupported' ? 'right-1' : 'left-1'
                }`}></div>
              </button>
            </div>
            
            {/* Offline Access */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  onlineStatus 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                }`}>
                  {onlineStatus ? <Wifi size={16} /> : <WifiOff size={16} />}
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-white block">{t('settings.offlineAccess')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {onlineStatus ? t('settings.connected') : t('settings.offlineModeActive')}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleOfflineToggle}
                className={`w-11 h-6 rounded-full relative transition-colors ${offlineAccess ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${offlineAccess ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            
            {/* Language */}
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-white block">{t('settings.language')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {LANGUAGES[language].nativeName}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </section>

        {/* Tree Management - Admin Only */}
        {isAdmin && (
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Tree Management</h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
              <button 
                onClick={() => setShowExportModal(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Download size={16} />
                  </div>
                  <div>
                    <span className="font-medium text-slate-800 dark:text-white block">Export Data</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Download tree as JSON, CSV, or Text</span>
                  </div>
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
        )}

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
                    {user?.role === 'admin' && 'Admin (Full Access)'}
                    {user?.role === 'co-admin' && 'Co-Admin (Can approve)'}
                    {user?.role === 'editor' && 'Editor (Can edit)'}
                    {user?.role === 'contributor' && 'Contributor (Can suggest)'}
                    {user?.role === 'viewer' && 'Viewer (View only)'}
                    {!user?.role && 'Viewer (View only)'}
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
                  <span className={`text-xs ${user?.person_id ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {user?.person_id 
                      ? `Linked as ${user.person_name || 'family member'}` 
                      : 'Link your profile to the tree'}
                  </span>
                </div>
              </div>
              {user?.person_id ? (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                  ✓ Linked
                </span>
              ) : (
                <ChevronRight size={16} className="text-slate-400" />
              )}
            </button>
            
            {/* Request Permissions Button - Show for all non-admin users */}
            {user?.role !== 'admin' && (
              <button 
                onClick={() => setShowRequestModal(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <span className="font-medium text-slate-800 dark:text-white block">Request Upgrade</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ask admin for higher access</span>
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
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Request Role Upgrade</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Current: <span className="font-medium">{getRoleLabel(user?.role || 'viewer')}</span>
                </p>
              </div>

              <div className="p-6 space-y-4">
                {availableUpgrades.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You already have the highest available role.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Request Upgrade To
                      </label>
                      <div className="space-y-2">
                        {availableUpgrades.map((role) => (
                          <label
                            key={role}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              requestRole === role
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="requestRole"
                              value={role}
                              checked={requestRole === role}
                              onChange={(e) => setRequestRole(e.target.value as UserRole)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">{getRoleLabel(role)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleDescription(role)}</p>
                            </div>
                          </label>
                        ))}
                      </div>
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
                        dir="auto"
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
                  </>
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
                {availableUpgrades.length > 0 && (
                  <button
                    onClick={handleRequestPermission}
                    disabled={requestStatus === 'loading'}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestStatus === 'loading' ? 'Sending...' : 'Send Request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Identity Claim Modal */}
        {showIdentityModal && (
          <IdentityClaimModal onClose={() => setShowIdentityModal(false)} />
        )}

        {/* Language Selection Modal */}
        {showLanguageModal && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLanguageModal(false)}
          >
            <div 
              className="bg-white dark:bg-slate-800 w-full max-w-sm mx-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('settings.selectLanguage')}</h3>
              </div>

              <div className="p-4 space-y-2">
                {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setShowLanguageModal(false);
                    }}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                      language === lang
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                        : 'bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {lang === 'en' ? '🇬🇧' : lang === 'de' ? '🇩🇪' : '🇮🇷'}
                      </span>
                      <div className="text-left">
                        <p className={`font-medium ${language === lang ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                          {LANGUAGES[lang].nativeName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {LANGUAGES[lang].name}
                        </p>
                      </div>
                    </div>
                    {language === lang && (
                      <span className="text-indigo-500 dark:text-indigo-400">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
