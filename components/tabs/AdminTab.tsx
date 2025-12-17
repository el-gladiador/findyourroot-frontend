'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CheckCircle, XCircle, Clock, Mail, MessageSquare, 
  UserCheck, Link2, Shield, UserMinus,
  Edit3, Trash2, Plus, Eye, RefreshCw, Bell
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { 
  PermissionRequest, IdentityClaimRequest, Suggestion, UserListItem, UserRole,
  getRoleLabel, getRoleDescription, canApprove
} from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useRealtimeAdminSync, useAdminPendingCounts } from '@/lib/realtime-sync';

type TabType = 'permissions' | 'identity' | 'suggestions' | 'users';

// Auto-refresh interval in milliseconds (used as fallback if real-time is not working)
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

const AdminTab = () => {
  const user = useAppStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const canReviewSuggestions = user && canApprove(user.role);

  const [activeTab, setActiveTab] = useState<TabType>(canReviewSuggestions ? 'suggestions' : 'permissions');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Filter states (defined before real-time hooks to avoid forward references)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [claimFilter, setClaimFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [suggestionFilter, setSuggestionFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Real-time sync for suggestions
  const { 
    data: realtimeSuggestions, 
    isLoading: isLoadingRealtimeSuggestions,
    newItemCount: newSuggestionCount,
    clearNewItemCount: clearSuggestionCount
  } = useRealtimeAdminSync('suggestions', suggestionFilter);
  
  // Real-time sync for permission requests
  const { 
    data: realtimeRequests, 
    isLoading: isLoadingRealtimeRequests,
  } = useRealtimeAdminSync('permission_requests', filter);
  
  // Real-time sync for identity claims
  const { 
    data: realtimeClaims, 
    isLoading: isLoadingRealtimeClaims,
  } = useRealtimeAdminSync('identity_claims', claimFilter);
  
  // Get pending counts for badges
  const pendingCounts = useAdminPendingCounts();
  
  // Permission requests state
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Identity claims state
  const [identityClaims, setIdentityClaims] = useState<IdentityClaimRequest[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Suggestions state (fallback for non-realtime)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});

  // Users state (admin only)
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Use realtime data if available, otherwise use fetched data
  const displaySuggestions = realtimeSuggestions.length > 0 ? realtimeSuggestions : suggestions;
  const displayRequests = realtimeRequests.length > 0 ? realtimeRequests as PermissionRequest[] : requests;
  const displayClaims = realtimeClaims.length > 0 ? realtimeClaims as IdentityClaimRequest[] : identityClaims;
  
  const suggestionsLoading = isLoadingRealtimeSuggestions && isLoadingSuggestions;
  const requestsLoading = isLoadingRealtimeRequests && isLoading;
  const claimsLoading = isLoadingRealtimeClaims && isLoadingClaims;
  
  // Clear new suggestion count when viewing suggestions tab
  useEffect(() => {
    if (activeTab === 'suggestions') {
      clearSuggestionCount();
    }
  }, [activeTab, clearSuggestionCount]);

  const fetchRequests = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    const response = await ApiClient.getPermissionRequests(filter);
    if (response.data) {
      setRequests(response.data);
    }
    if (showLoading) setIsLoading(false);
    setLastRefresh(new Date());
  }, [filter]);

  const fetchIdentityClaims = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingClaims(true);
    const response = await ApiClient.getIdentityClaims(claimFilter);
    if (response.data) {
      setIdentityClaims(response.data);
    } else {
      setIdentityClaims([]);
    }
    if (showLoading) setIsLoadingClaims(false);
    setLastRefresh(new Date());
  }, [claimFilter]);

  const fetchSuggestions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingSuggestions(true);
    const response = await ApiClient.getAllSuggestions(suggestionFilter);
    if (response.data) {
      setSuggestions(response.data);
    } else {
      setSuggestions([]);
    }
    if (showLoading) setIsLoadingSuggestions(false);
    setLastRefresh(new Date());
  }, [suggestionFilter]);

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingUsers(true);
    const response = await ApiClient.getAllUsers();
    if (response.data) {
      setUsers(response.data);
    } else {
      setUsers([]);
    }
    if (showLoading) setIsLoadingUsers(false);
    setLastRefresh(new Date());
  }, []);

  // Manual refresh function
  const handleManualRefresh = () => {
    if (activeTab === 'permissions' && isAdmin) {
      fetchRequests(true);
    } else if (activeTab === 'identity' && isAdmin) {
      fetchIdentityClaims(true);
    } else if (activeTab === 'suggestions' && canReviewSuggestions) {
      fetchSuggestions(true);
    } else if (activeTab === 'users' && isAdmin) {
      fetchUsers(true);
    }
  };

  // Initial fetch when tab changes
  useEffect(() => {
    if (activeTab === 'permissions' && isAdmin) {
      fetchRequests();
    }
  }, [filter, activeTab, isAdmin, fetchRequests]);

  useEffect(() => {
    if (activeTab === 'identity' && isAdmin) {
      fetchIdentityClaims();
    }
  }, [claimFilter, activeTab, isAdmin, fetchIdentityClaims]);

  useEffect(() => {
    if (activeTab === 'suggestions' && canReviewSuggestions) {
      fetchSuggestions();
    }
  }, [suggestionFilter, activeTab, canReviewSuggestions, fetchSuggestions]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, fetchUsers]);

  // Auto-refresh polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'permissions' && isAdmin) {
        fetchRequests(false); // Don't show loading spinner for auto-refresh
      } else if (activeTab === 'identity' && isAdmin) {
        fetchIdentityClaims(false);
      } else if (activeTab === 'suggestions' && canReviewSuggestions) {
        fetchSuggestions(false);
      } else if (activeTab === 'users' && isAdmin) {
        fetchUsers(false);
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTab, isAdmin, canReviewSuggestions, fetchRequests, fetchIdentityClaims, fetchSuggestions, fetchUsers]);

  const handleApprove = async (id: string) => {
    if (confirm('Approve this permission request? The user will be granted the requested role.')) {
      const response = await ApiClient.approvePermissionRequest(id);
      if (!response.error) {
        fetchRequests();
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Reject this permission request?')) {
      const response = await ApiClient.rejectPermissionRequest(id);
      if (!response.error) {
        fetchRequests();
      }
    }
  };

  const handleApproveClaim = async (id: string) => {
    const notes = reviewNotes[id] || '';
    if (confirm('Approve this identity claim? The user will be linked to the tree node.')) {
      const response = await ApiClient.reviewIdentityClaim(id, true, notes);
      if (!response.error) {
        fetchIdentityClaims();
      }
    }
  };

  const handleRejectClaim = async (id: string) => {
    const notes = reviewNotes[id] || '';
    if (confirm('Reject this identity claim?')) {
      const response = await ApiClient.reviewIdentityClaim(id, false, notes);
      if (!response.error) {
        fetchIdentityClaims();
      }
    }
  };

  const handleApproveSuggestion = async (id: string) => {
    const notes = suggestionNotes[id] || '';
    if (confirm('Approve this suggestion? The change will be applied to the tree.')) {
      const response = await ApiClient.reviewSuggestion(id, true, notes);
      if (!response.error) {
        fetchSuggestions();
      }
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    const notes = suggestionNotes[id] || '';
    if (confirm('Reject this suggestion?')) {
      const response = await ApiClient.reviewSuggestion(id, false, notes);
      if (!response.error) {
        fetchSuggestions();
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    if (confirm(`Change this user's role to ${getRoleLabel(newRole)}?`)) {
      const response = await ApiClient.updateUserRole(userId, newRole);
      if (!response.error) {
        fetchUsers();
        setShowRoleModal(false);
        setSelectedUser(null);
      }
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (confirm('Revoke this user\'s access? They will be set to Viewer role.')) {
      const response = await ApiClient.revokeUserAccess(userId);
      if (!response.error) {
        fetchUsers();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'co-admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'contributor':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <Plus size={16} className="text-green-500" />;
      case 'edit': return <Edit3 size={16} className="text-blue-500" />;
      case 'delete': return <Trash2 size={16} className="text-red-500" />;
      default: return <Eye size={16} />;
    }
  };

  const getSuggestionTypeBadge = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'edit':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'delete':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  // Role selection modal
  const RoleModal = () => {
    if (!showRoleModal || !selectedUser) return null;

    const roles: UserRole[] = ['viewer', 'contributor', 'editor', 'co-admin', 'admin'];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Change Role for {selectedUser.email}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Current role: <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(selectedUser.role)}`}>{getRoleLabel(selectedUser.role)}</span>
          </p>
          
          <div className="space-y-2 mb-6">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleUpdateUserRole(selectedUser.id, role)}
                disabled={role === selectedUser.role}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  role === selectedUser.role
                    ? 'bg-slate-100 dark:bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{getRoleLabel(role)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getRoleDescription(role)}</p>
                  </div>
                  {role === selectedUser.role && (
                    <span className="text-xs text-slate-400">Current</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
            className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {isAdmin ? 'Admin Panel' : 'Review Panel'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {isAdmin ? 'Manage requests, users, and contributions' : 'Review and manage contributions'}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          title={`Last updated: ${lastRefresh.toLocaleTimeString()}`}
        >
          <RefreshCw size={16} className={isLoading || isLoadingSuggestions || isLoadingClaims || isLoadingUsers ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Main Tab Selector */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 overflow-x-auto">
        {canReviewSuggestions && (
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`relative flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'suggestions'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 size={14} />
            Suggestions
            {pendingCounts.suggestions > 0 && activeTab !== 'suggestions' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingCounts.suggestions > 9 ? '9+' : pendingCounts.suggestions}
              </span>
            )}
          </button>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`relative flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'permissions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              Permissions
              {pendingCounts.permissionRequests > 0 && activeTab !== 'permissions' && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCounts.permissionRequests > 9 ? '9+' : pendingCounts.permissionRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`relative flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'identity'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck size={14} />
              Identity
              {pendingCounts.identityClaims > 0 && activeTab !== 'identity' && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCounts.identityClaims > 9 ? '9+' : pendingCounts.identityClaims}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield size={14} />
              Users
            </button>
          </>
        )}
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && canReviewSuggestions && (
        <>
          <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setSuggestionFilter('pending')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                suggestionFilter === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock size={16} className="inline mr-1" />
              Pending
            </button>
            <button
              onClick={() => setSuggestionFilter('approved')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                suggestionFilter === 'approved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle size={16} className="inline mr-1" />
              Approved
            </button>
            <button
              onClick={() => setSuggestionFilter('rejected')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                suggestionFilter === 'rejected'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <XCircle size={16} className="inline mr-1" />
              Rejected
            </button>
          </div>

          <div className="space-y-4">
            {suggestionsLoading || isLoadingSuggestions ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : displaySuggestions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Edit3 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {suggestionFilter} suggestions</p>
              </div>
            ) : (
              displaySuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                >
                  {/* Header: Type badge + Date */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getSuggestionTypeBadge(suggestion.type)}`}>
                      {suggestion.type}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(suggestion.created_at)}</span>
                  </div>

                  {/* Main content */}
                  <div className="mb-3">
                    {suggestion.type === 'add' && suggestion.person_data && (
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Add <span className="font-semibold">{suggestion.person_data.name}</span>
                        <span className="text-slate-500"> • {suggestion.person_data.role}</span>
                      </p>
                    )}
                    {suggestion.type === 'edit' && suggestion.target_person && (
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Edit <span className="font-semibold">{suggestion.target_person.name}</span>
                        {suggestion.person_data?.name && suggestion.person_data.name !== suggestion.target_person.name && (
                          <span className="text-slate-500"> → {suggestion.person_data.name}</span>
                        )}
                      </p>
                    )}
                    {suggestion.type === 'delete' && suggestion.target_person && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Delete <span className="font-semibold">{suggestion.target_person.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Contributor email */}
                  <p className="text-xs text-slate-500 mb-3">
                    by {suggestion.user_email}
                  </p>

                  {/* Message if exists */}
                  {suggestion.message && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 truncate">
                      "{suggestion.message}"
                    </p>
                  )}

                  {suggestionFilter === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveSuggestion(suggestion.id)}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectSuggestion(suggestion.id)}
                        className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {suggestionFilter !== 'pending' && (
                    <span className={`text-xs font-medium ${
                      suggestionFilter === 'approved' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {suggestionFilter === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        {suggestion.reviewer_email && (
                          <p className="text-xs mt-1 opacity-75">by {suggestion.reviewer_email}</p>
                        )}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Permission Requests Tab */}
      {activeTab === 'permissions' && isAdmin && (
        <>
          <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock size={16} className="inline mr-1" />
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle size={16} className="inline mr-1" />
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <XCircle size={16} className="inline mr-1" />
              Rejected
            </button>
          </div>

          <div className="space-y-4">
            {requestsLoading || isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : displayRequests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {filter} requests</p>
              </div>
            ) : (
              displayRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                >
                  {/* Header: Role badge + Date */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                      {getRoleLabel(request.requested_role)}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(request.created_at)}</span>
                  </div>

                  {/* Email */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
                    {request.user_email}
                  </p>

                  {/* Message if exists */}
                  {request.message && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 truncate">
                      "{request.message}"
                    </p>
                  )}

                  {filter === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {filter !== 'pending' && (
                    <span className={`text-xs font-medium ${
                      filter === 'approved' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {filter === 'approved' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Identity Claims Tab */}
      {activeTab === 'identity' && isAdmin && (
        <>
          <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setClaimFilter('pending')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                claimFilter === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock size={16} className="inline mr-1" />
              Pending
            </button>
            <button
              onClick={() => setClaimFilter('approved')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                claimFilter === 'approved'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Link2 size={16} className="inline mr-1" />
              Linked
            </button>
            <button
              onClick={() => setClaimFilter('rejected')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                claimFilter === 'rejected'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <XCircle size={16} className="inline mr-1" />
              Rejected
            </button>
          </div>

          <div className="space-y-4">
            {claimsLoading || isLoadingClaims ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : displayClaims.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <UserCheck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {claimFilter} identity claims</p>
              </div>
            ) : (
              displayClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                >
                  {/* Header: Identity label + Date */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      Identity Claim
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(claim.created_at)}</span>
                  </div>

                  {/* Claim info */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
                    <span className="text-slate-500">Claims:</span> <span className="font-semibold">{claim.person_name}</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    by {claim.user_email}
                  </p>

                  {/* Message if exists */}
                  {claim.message && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-3 truncate">
                      "{claim.message}"
                    </p>
                  )}

                  {claimFilter === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveClaim(claim.id)}
                        className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Link
                      </button>
                      <button
                        onClick={() => handleRejectClaim(claim.id)}
                        className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {claimFilter !== 'pending' && (
                    <span className={`text-xs font-medium ${
                      claimFilter === 'approved' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {claimFilter === 'approved' ? '✓ Linked' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && isAdmin && (
        <>
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <Shield size={14} className="inline mr-1" />
              Manage user roles and access permissions
            </p>
          </div>

          <div className="space-y-3">
            {isLoadingUsers ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No users found</p>
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{u.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          {u.is_verified && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                              <CheckCircle size={10} /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {u.email !== user?.email && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                          className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Change role"
                        >
                          <Edit3 size={18} />
                        </button>
                        {u.role !== 'viewer' && (
                          <button
                            onClick={() => handleRevokeAccess(u.id)}
                            className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Revoke access"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {u.email === user?.email && (
                      <span className="text-xs text-slate-400 italic">You</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <RoleModal />
    </div>
  );
};

export default AdminTab;
