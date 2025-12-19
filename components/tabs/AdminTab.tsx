'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, CheckCircle, XCircle, Clock, Mail, MessageSquare, 
  UserCheck, Link2, Shield, UserMinus,
  Edit3, Trash2, Plus, Eye, Bell, Instagram, Search, FileText, Upload, Loader2
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { 
  PermissionRequest, IdentityClaimRequest, Suggestion, UserListItem, UserRole, Person,
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
  
  // Notes for reviews
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});

  // Users state (admin only) - no realtime for users, uses polling
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Link user modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUserId, setLinkUserId] = useState<string | null>(null);
  const [linkPersonSearch, setLinkPersonSearch] = useState('');
  const [linkInstagram, setLinkInstagram] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  
  // Instagram lookup state
  const [instagramProfile, setInstagramProfile] = useState<{
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    is_verified: boolean;
  } | null>(null);
  const [isLookingUpInstagram, setIsLookingUpInstagram] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  
  // Populate Tree modal state (admin only)
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [populateText, setPopulateText] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  
  // Get family data for person selection
  const familyData = useAppStore((state) => state.familyData);
  
  // Clear new suggestion count when viewing suggestions tab
  useEffect(() => {
    if (activeTab === 'suggestions') {
      clearSuggestionCount();
    }
  }, [activeTab, clearSuggestionCount]);

  // Fetch users (no realtime sync for users collection)
  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingUsers(true);
    const response = await ApiClient.getAllUsers();
    if (response.data) {
      setUsers(response.data);
    } else {
      setUsers([]);
    }
    if (showLoading) setIsLoadingUsers(false);
  }, []);

  // Fetch users when users tab is active
  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, fetchUsers]);

  // Auto-refresh polling for users tab only
  useEffect(() => {
    if (activeTab !== 'users' || !isAdmin) return;
    
    const interval = setInterval(() => {
      fetchUsers(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTab, isAdmin, fetchUsers]);

  const handleApprove = async (id: string) => {
    if (confirm('Approve this permission request? The user will be granted the requested role.')) {
      await ApiClient.approvePermissionRequest(id);
      // Real-time sync will update UI automatically
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Reject this permission request?')) {
      await ApiClient.rejectPermissionRequest(id);
      // Real-time sync will update UI automatically
    }
  };

  const handleApproveClaim = async (id: string) => {
    const notes = reviewNotes[id] || '';
    if (confirm('Approve this identity claim? The user will be linked to the tree node.')) {
      await ApiClient.reviewIdentityClaim(id, true, notes);
      // Real-time sync will update UI automatically
    }
  };

  const handleRejectClaim = async (id: string) => {
    const notes = reviewNotes[id] || '';
    if (confirm('Reject this identity claim?')) {
      await ApiClient.reviewIdentityClaim(id, false, notes);
      // Real-time sync will update UI automatically
    }
  };

  const handleApproveSuggestion = async (id: string) => {
    const notes = suggestionNotes[id] || '';
    if (confirm('Approve this suggestion? The change will be applied to the tree.')) {
      await ApiClient.reviewSuggestion(id, true, notes);
      // Real-time sync will update UI automatically
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    const notes = suggestionNotes[id] || '';
    if (confirm('Reject this suggestion?')) {
      await ApiClient.reviewSuggestion(id, false, notes);
      // Real-time sync will update UI automatically
    }
  };

  // Auto-group suggestions by target_person_id + type
  const groupedSuggestionsList = useMemo(() => {
    const groups = new Map<string, Suggestion[]>();
    
    (realtimeSuggestions as Suggestion[]).forEach((s) => {
      const key = `${s.type}-${s.target_person_id || 'new'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(s);
    });
    
    return Array.from(groups.values());
  }, [realtimeSuggestions]);

  // Batch approve/reject handlers
  const handleBatchApprove = async (suggestionIds: string[], groupInfo: string) => {
    const count = suggestionIds.length;
    if (confirm(`Approve ${count} suggestion${count > 1 ? 's' : ''} (${groupInfo})? Changes will be applied to the tree.`)) {
      await ApiClient.batchReviewSuggestions(suggestionIds, true);
    }
  };

  const handleBatchReject = async (suggestionIds: string[], groupInfo: string) => {
    const count = suggestionIds.length;
    if (confirm(`Reject ${count} suggestion${count > 1 ? 's' : ''} (${groupInfo})?`)) {
      await ApiClient.batchReviewSuggestions(suggestionIds, false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    if (confirm(`Change this user's role to ${getRoleLabel(newRole)}?`)) {
      const response = await ApiClient.updateUserRole(userId, newRole);
      if (!response.error) {
        // Refresh users list (no real-time sync for users)
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
        // Refresh users list (no real-time sync for users)
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

  // Handle linking user to tree node
  const handleLinkUserToPerson = async (personId: string) => {
    if (!linkUserId) return;
    
    setIsLinking(true);
    const response = await ApiClient.linkUserToPerson(linkUserId, personId, linkInstagram || undefined);
    setIsLinking(false);
    
    if (!response.error) {
      fetchUsers();
      setShowLinkModal(false);
      setLinkUserId(null);
      setLinkPersonSearch('');
      setLinkInstagram('');
      setInstagramProfile(null);
      setInstagramError(null);
    }
  };

  // Handle Instagram lookup
  const handleInstagramLookup = async () => {
    if (!linkInstagram.trim()) return;
    
    setIsLookingUpInstagram(true);
    setInstagramError(null);
    setInstagramProfile(null);
    
    const response = await ApiClient.lookupInstagramProfile(linkInstagram.trim());
    
    setIsLookingUpInstagram(false);
    
    if (response.error) {
      setInstagramError(response.error);
    } else if (response.data) {
      setInstagramProfile(response.data);
    }
  };

  // Filter unlinked persons for linking
  const unlinkedPersons = familyData.filter(
    (p) => !p.linked_user_id && p.name.toLowerCase().includes(linkPersonSearch.toLowerCase())
  );

  // Get target user for link modal
  const linkTargetUser = linkUserId ? users.find(u => u.id === linkUserId) : null;

  // Roles list for role modal
  const rolesList: UserRole[] = ['viewer', 'contributor', 'co-admin', 'admin'];

  return (
    <div className="pb-32 pt-4 px-4">
      {/* Compact header with live indicator */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {isAdmin ? 'Admin' : 'Review'}
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowPopulateModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <FileText size={12} />
              Populate
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400 text-xs">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Main Tab Selector */}
      <div className="flex gap-1 mb-4 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 overflow-x-auto">
        {canReviewSuggestions && (
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`relative flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'suggestions'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 size={14} />
            Suggestions
            {pendingCounts.suggestions > 0 && activeTab !== 'suggestions' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCounts.suggestions > 9 ? '9+' : pendingCounts.suggestions}
              </span>
            )}
          </button>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`relative flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'permissions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              Requests
              {pendingCounts.permissionRequests > 0 && activeTab !== 'permissions' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCounts.permissionRequests > 9 ? '9+' : pendingCounts.permissionRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`relative flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'identity'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck size={14} />
              Claims
              {pendingCounts.identityClaims > 0 && activeTab !== 'identity' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCounts.identityClaims > 9 ? '9+' : pendingCounts.identityClaims}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
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
          {/* Status Filter only - no view mode toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => setSuggestionFilter('pending')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                suggestionFilter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setSuggestionFilter('approved')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                suggestionFilter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setSuggestionFilter('rejected')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                suggestionFilter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Rejected
            </button>
          </div>

          {/* Auto-grouped suggestions list */}
          <div className="space-y-3">
            {isLoadingRealtimeSuggestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : groupedSuggestionsList.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <Edit3 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No {suggestionFilter} suggestions</p>
              </div>
            ) : (
              groupedSuggestionsList.map((group) => {
                const first = group[0];
                const isGrouped = group.length > 1;
                const allIds = group.map(s => s.id);
                const allEmails = [...new Set(group.map(s => s.user_email))];
                
                return (
                  <div
                    key={`${first.type}-${first.target_person_id || first.id}`}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${getSuggestionTypeBadge(first.type)}`}>
                        {first.type}
                      </span>
                      {isGrouped && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                          {group.length} votes
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-auto">{formatDate(first.created_at)}</span>
                    </div>

                    {/* Content */}
                    <div className="mb-2">
                      {first.type === 'add' && first.person_data && (
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          Add <span className="font-medium">{first.person_data.name}</span>
                          <span className="text-slate-400 text-xs"> • {first.person_data.role}</span>
                        </p>
                      )}
                      {first.type === 'edit' && first.target_person && (
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          Edit <span className="font-medium">{first.target_person.name}</span>
                        </p>
                      )}
                      {first.type === 'delete' && first.target_person && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Delete <span className="font-medium">{first.target_person.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Contributors */}
                    <p className="text-[10px] text-slate-400 mb-2">
                      by {allEmails.slice(0, 2).join(', ')}
                      {allEmails.length > 2 && ` +${allEmails.length - 2}`}
                    </p>

                    {/* Actions */}
                    {suggestionFilter === 'pending' && (
                      <div className="flex gap-2">
                        {isGrouped ? (
                          <>
                            <button
                              onClick={() => handleBatchApprove(allIds, `${first.type} - ${first.target_person?.name || first.person_data?.name || 'new'}`)}
                              className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                            >
                              ✓ Approve All
                            </button>
                            <button
                              onClick={() => handleBatchReject(allIds, `${first.type} - ${first.target_person?.name || first.person_data?.name || 'new'}`)}
                              className="flex-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-md transition-colors"
                            >
                              ✗ Reject All
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApproveSuggestion(first.id)}
                              className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectSuggestion(first.id)}
                              className="flex-1 px-2 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-md transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {suggestionFilter !== 'pending' && (
                      <span className={`text-xs font-medium ${
                        suggestionFilter === 'approved' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {suggestionFilter === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        {first.reviewer_email && (
                          <span className="text-xs opacity-75 ml-1">by {first.reviewer_email}</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Permission Requests Tab */}
      {activeTab === 'permissions' && isAdmin && (
        <>
          {/* Compact status filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="space-y-3">
            {isLoadingRealtimeRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : realtimeRequests.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No {filter} requests</p>
              </div>
            ) : (
              (realtimeRequests as PermissionRequest[]).map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  {/* Compact header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                      {getRoleLabel(request.requested_role)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">{formatDate(request.created_at)}</span>
                  </div>

                  {/* Email */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                    {request.user_email}
                  </p>

                  {/* Message if exists */}
                  {request.message && (
                    <p className="text-[10px] text-slate-400 italic mb-2 truncate">
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
          {/* Compact status filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => setClaimFilter('pending')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                claimFilter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setClaimFilter('approved')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                claimFilter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Linked
            </button>
            <button
              onClick={() => setClaimFilter('rejected')}
              className={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                claimFilter === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Rejected
            </button>
          </div>

          <div className="space-y-3">
            {isLoadingRealtimeClaims ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : realtimeClaims.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <UserCheck size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No {claimFilter} claims</p>
              </div>
            ) : (
              (realtimeClaims as IdentityClaimRequest[]).map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  {/* Compact header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      Identity Claim
                    </span>
                    <span className="text-[10px] text-slate-400 ml-auto">{formatDate(claim.created_at)}</span>
                  </div>

                  {/* Claim info */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
                    <span className="text-slate-500 text-xs">Claims:</span> <span className="font-medium">{claim.person_name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mb-2">
                    by {claim.user_email}
                  </p>

                  {/* Message if exists */}
                  {claim.message && (
                    <p className="text-[10px] text-slate-400 italic mb-2 truncate">
                      "{claim.message}"
                    </p>
                  )}

                  {claimFilter === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveClaim(claim.id)}
                        className="flex-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                      >
                        Link
                      </button>
                      <button
                        onClick={() => handleRejectClaim(claim.id)}
                        className="flex-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-md transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {claimFilter !== 'pending' && (
                    <span className={`text-[10px] font-medium ${
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
          <div className="space-y-3">
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No users found</p>
              </div>
            ) : (
              users.map((u) => {
                const linkedPerson = u.person_id ? familyData.find(p => p.id === u.person_id) : null;
                
                return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 p-3"
                >
                  {/* User info row */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                        {u.is_verified && (
                          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5">
                            <CheckCircle size={8} /> Verified
                          </span>
                        )}
                        {linkedPerson && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5 truncate max-w-[100px]">
                            <Link2 size={8} className="shrink-0" /> <span className="truncate">{linkedPerson.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact actions row */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex-wrap">
                    {/* Link/Unlink button */}
                    {!linkedPerson ? (
                      <button
                        onClick={() => { setLinkUserId(u.id); setShowLinkModal(true); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md transition-colors"
                      >
                        <Link2 size={10} />
                        Link
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Unlink ${u.email} from ${linkedPerson?.name || 'tree node'}?`)) {
                            ApiClient.unlinkIdentity(u.id).then(() => fetchUsers());
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/40 rounded-md transition-colors"
                      >
                        <Link2 size={10} />
                        Unlink
                      </button>
                    )}
                    {u.email !== user?.email && (
                      <>
                        <button
                          onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                        >
                          <Edit3 size={10} />
                          Role
                        </button>
                        {u.role !== 'viewer' && (
                          <button
                            onClick={() => handleRevokeAccess(u.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          >
                            <UserMinus size={10} />
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                    {u.email === user?.email && (
                      <span className="text-[10px] text-slate-400 italic ml-auto">You</span>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </>
      )}

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Change Role
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {selectedUser.email} • <span className={`px-1.5 py-0.5 rounded text-[10px] ${getRoleBadgeColor(selectedUser.role)}`}>{getRoleLabel(selectedUser.role)}</span>
            </p>
            
            <div className="space-y-1.5 mb-4">
              {rolesList.map((role) => (
                <button
                  key={role}
                  onClick={() => handleUpdateUserRole(selectedUser.id, role)}
                  disabled={role === selectedUser.role}
                  className={`w-full p-2 rounded-lg text-left transition-colors ${
                    role === selectedUser.role
                      ? 'bg-slate-100 dark:bg-slate-700 opacity-50 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{getRoleLabel(role)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{getRoleDescription(role)}</p>
                    </div>
                    {role === selectedUser.role && (
                      <span className="text-[10px] text-slate-400">Current</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
              className="w-full py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && linkTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Link to Tree
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              {linkTargetUser.email}
            </p>
            
            {/* Instagram Input */}
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Instagram size={12} className="text-pink-500" />
                Instagram (optional)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={linkInstagram}
                  onChange={(e) => {
                    setLinkInstagram(e.target.value.replace('@', ''));
                    setInstagramProfile(null);
                    setInstagramError(null);
                  }}
                  placeholder="username"
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleInstagramLookup}
                  disabled={!linkInstagram.trim() || isLookingUpInstagram}
                  className="px-2.5 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  {isLookingUpInstagram ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                </button>
              </div>
              
              {/* Instagram Profile Preview */}
              {instagramProfile && (
                <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-2">
                    <img
                      src={instagramProfile.avatar_url}
                      alt={instagramProfile.username}
                      className="w-8 h-8 rounded-full object-cover border border-pink-300 dark:border-pink-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {instagramProfile.full_name || instagramProfile.username}
                      </p>
                      <p className="text-[10px] text-pink-600 dark:text-pink-400">@{instagramProfile.username}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Instagram Error */}
              {instagramError && (
                <p className="text-[10px] text-red-500 mt-1">{instagramError}</p>
              )}
            </div>
            
            {/* Search persons */}
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Search size={12} />
                Search Tree
              </label>
              <input
                type="text"
                value={linkPersonSearch}
                onChange={(e) => setLinkPersonSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
            
            {/* Available persons */}
            <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
              {unlinkedPersons.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">
                  No unlinked persons
                </p>
              ) : (
                unlinkedPersons.slice(0, 10).map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleLinkUserToPerson(person.id)}
                    disabled={isLinking}
                    className="w-full p-2 rounded-lg text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <img
                      src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=32`}
                      alt={person.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{person.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{person.role}</p>
                    </div>
                    {isLinking && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                ))
              )}
              {unlinkedPersons.length > 10 && (
                <p className="text-[10px] text-slate-500 text-center py-1">
                  +{unlinkedPersons.length - 10} more
                </p>
              )}
            </div>

            <button
              onClick={() => { 
                setShowLinkModal(false); 
                setLinkUserId(null); 
                setLinkPersonSearch('');
                setLinkInstagram('');
                setInstagramProfile(null);
                setInstagramError(null);
              }}
              className="w-full py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Populate Tree Modal */}
      {showPopulateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                Populate Tree from Text
              </h3>
              <button
                onClick={() => { setShowPopulateModal(false); setPopulateText(''); setPopulateResult(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XCircle size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Paste an indentation-based list. Each level of indentation (2 or 4 spaces, or tab) creates a child.
            </p>

            {/* Example */}
            <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 mb-1">Example:</p>
              <pre className="text-[10px] text-slate-600 dark:text-slate-300 font-mono whitespace-pre">
{`Grandfather
    Father
        Child 1
        Child 2
    Uncle
Grandmother`}
              </pre>
            </div>

            {/* Text Input */}
            <textarea
              value={populateText}
              onChange={(e) => setPopulateText(e.target.value)}
              placeholder="Paste your family tree here..."
              className="w-full h-48 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
            />

            {/* Result message */}
            {populateResult && (
              <div className={`mt-3 p-2 rounded-lg text-xs ${
                populateResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {populateResult.message}
                {populateResult.count !== undefined && (
                  <span className="font-medium"> ({populateResult.count} people created)</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setShowPopulateModal(false); setPopulateText(''); setPopulateResult(null); }}
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!populateText.trim()) return;
                  setIsPopulating(true);
                  setPopulateResult(null);
                  
                  const response = await ApiClient.populateTreeFromText(populateText);
                  
                  if (response.error) {
                    setPopulateResult({ success: false, message: response.error });
                  } else if (response.data) {
                    setPopulateResult({ 
                      success: true, 
                      message: 'Tree populated successfully!',
                      count: response.data.created_count
                    });
                    setPopulateText('');
                  }
                  setIsPopulating(false);
                }}
                disabled={isPopulating || !populateText.trim()}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPopulating ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={12} />
                    Populate Tree
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTab;
