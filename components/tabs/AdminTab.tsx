'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CheckCircle, XCircle, Clock, Mail, MessageSquare, 
  UserCheck, Link2, Shield, UserMinus,
  Edit3, Trash2, Plus, Eye, Bell, Instagram, Search
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { 
  PermissionRequest, IdentityClaimRequest, Suggestion, UserListItem, UserRole, Person,
  getRoleLabel, getRoleDescription, canApprove, GroupedSuggestion
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
  
  // View mode for suggestions: individual or grouped
  const [suggestionViewMode, setSuggestionViewMode] = useState<'individual' | 'grouped'>('grouped');
  
  // Grouped suggestions state
  const [groupedSuggestions, setGroupedSuggestions] = useState<GroupedSuggestion[]>([]);
  const [isLoadingGrouped, setIsLoadingGrouped] = useState(false);
  const [groupStats, setGroupStats] = useState({ total: 0, groups: 0 });
  
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

  // Fetch grouped suggestions
  const fetchGroupedSuggestions = useCallback(async () => {
    setIsLoadingGrouped(true);
    try {
      const response = await ApiClient.getGroupedSuggestions(suggestionFilter);
      if (response.data) {
        setGroupedSuggestions(response.data.groups || []);
        setGroupStats({ 
          total: response.data.total_count || 0, 
          groups: response.data.group_count || 0 
        });
      }
    } catch (error) {
      console.error('Failed to fetch grouped suggestions:', error);
    } finally {
      setIsLoadingGrouped(false);
    }
  }, [suggestionFilter]);

  // Fetch grouped suggestions when view mode changes or filter changes
  useEffect(() => {
    if (suggestionViewMode === 'grouped' && activeTab === 'suggestions') {
      fetchGroupedSuggestions();
    }
  }, [suggestionViewMode, suggestionFilter, activeTab, fetchGroupedSuggestions]);

  // Refresh grouped suggestions when real-time data changes
  useEffect(() => {
    if (suggestionViewMode === 'grouped' && activeTab === 'suggestions' && realtimeSuggestions.length > 0) {
      fetchGroupedSuggestions();
    }
  }, [realtimeSuggestions.length, suggestionViewMode, activeTab, fetchGroupedSuggestions]);

  // Batch approve/reject handlers
  const handleBatchApprove = async (suggestionIds: string[], groupInfo: string) => {
    const count = suggestionIds.length;
    if (confirm(`تایید ${count} پیشنهاد${count > 1 ? '' : ''} (${groupInfo})؟ تغییر روی درخت اعمال می‌شود.`)) {
      const response = await ApiClient.batchReviewSuggestions(suggestionIds, true);
      if (!response.error) {
        fetchGroupedSuggestions();
      }
    }
  };

  const handleBatchReject = async (suggestionIds: string[], groupInfo: string) => {
    const count = suggestionIds.length;
    if (confirm(`رد ${count} پیشنهاد${count > 1 ? '' : ''} (${groupInfo})؟`)) {
      const response = await ApiClient.batchReviewSuggestions(suggestionIds, false);
      if (!response.error) {
        fetchGroupedSuggestions();
      }
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
  const rolesList: UserRole[] = ['viewer', 'contributor', 'editor', 'co-admin', 'admin'];

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
        {/* Real-time indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">Live</span>
        </div>
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
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setSuggestionViewMode('grouped')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  suggestionViewMode === 'grouped'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📊 دسته‌بندی شده
              </button>
              <button
                onClick={() => setSuggestionViewMode('individual')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  suggestionViewMode === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📝 تکی
              </button>
            </div>
            {suggestionViewMode === 'grouped' && groupStats.total > 0 && (
              <span className="text-xs text-slate-500" dir="rtl">
                {groupStats.total} پیشنهاد در {groupStats.groups} گروه
              </span>
            )}
          </div>

          {/* Status Filter */}
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

          {/* Grouped View */}
          {suggestionViewMode === 'grouped' && (
            <div className="space-y-4">
              {isLoadingGrouped ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : groupedSuggestions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <Edit3 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">پیشنهاد {suggestionFilter === 'pending' ? 'در انتظار' : suggestionFilter === 'approved' ? 'تایید شده' : 'رد شده'}‌ای وجود ندارد</p>
                </div>
              ) : (
                groupedSuggestions.map((group) => (
                  <div
                    key={group.group_id}
                    className={`bg-white dark:bg-slate-800 rounded-xl border-2 ${
                      group.has_conflicts 
                        ? 'border-orange-400 dark:border-orange-600' 
                        : 'border-slate-200 dark:border-slate-700'
                    } p-4`}
                  >
                    {/* Header: Type badge + Count + Date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getSuggestionTypeBadge(group.type)}`}>
                          {group.type === 'add' ? '➕ افزودن' : group.type === 'edit' ? '✏️ ویرایش' : '🗑️ حذف'}
                        </span>
                        {group.count > 1 && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                            {group.count} رأی
                          </span>
                        )}
                        {group.has_conflicts && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-bold animate-pulse">
                            ⚠️ تعارض
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(group.first_created_at)}</span>
                    </div>

                    {/* Conflict Warning */}
                    {group.has_conflicts && group.conflict_type && (
                      <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-xs text-orange-700 dark:text-orange-300" dir="rtl">
                          ⚠️ {group.conflict_type}
                        </p>
                      </div>
                    )}

                    {/* Main content */}
                    <div className="mb-3" dir="auto">
                      {group.type === 'add' && group.person_data && (
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          افزودن <span className="font-semibold">{group.person_data.name}</span>
                          <span className="text-slate-500"> • {group.person_data.role}</span>
                        </p>
                      )}
                      {group.type === 'edit' && group.target_person && (
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          ویرایش <span className="font-semibold">{group.target_person.name}</span>
                          {group.person_data?.name && group.person_data.name !== group.target_person.name && (
                            <span className="text-slate-500"> → {group.person_data.name}</span>
                          )}
                        </p>
                      )}
                      {group.type === 'delete' && group.target_person && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          حذف <span className="font-semibold">{group.target_person.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Contributors */}
                    <div className="mb-3" dir="rtl">
                      <p className="text-xs text-slate-500">
                        پیشنهاد از: {group.user_emails.slice(0, 3).join('، ')}
                        {group.user_emails.length > 3 && ` و ${group.user_emails.length - 3} نفر دیگر`}
                      </p>
                    </div>

                    {/* Messages if exist */}
                    {group.messages && group.messages.length > 0 && (
                      <div className="mb-3 text-xs text-slate-500 dark:text-slate-400" dir="auto">
                        <p className="font-medium mb-1">پیام‌ها:</p>
                        {group.messages.slice(0, 2).map((msg: string, idx: number) => (
                          <p key={idx} className="italic truncate">"{msg}"</p>
                        ))}
                        {group.messages.length > 2 && (
                          <p className="text-slate-400">و {group.messages.length - 2} پیام دیگر...</p>
                        )}
                      </div>
                    )}

                    {suggestionFilter === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBatchApprove(
                            group.suggestion_ids, 
                            `${group.type} - ${group.target_person?.name || group.person_data?.name || 'unknown'}`
                          )}
                          className={`flex-1 px-3 py-1.5 text-white text-sm rounded-lg transition-colors ${
                            group.has_conflicts 
                              ? 'bg-orange-500 hover:bg-orange-600' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {group.has_conflicts ? '⚠️ تایید با وجود تعارض' : '✓ تایید همه'}
                        </button>
                        <button
                          onClick={() => handleBatchReject(
                            group.suggestion_ids,
                            `${group.type} - ${group.target_person?.name || group.person_data?.name || 'unknown'}`
                          )}
                          className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg transition-colors"
                        >
                          ✗ رد همه
                        </button>
                      </div>
                    )}

                    {suggestionFilter !== 'pending' && (
                      <span className={`text-xs font-medium ${
                        suggestionFilter === 'approved' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {suggestionFilter === 'approved' ? '✓ تایید شده' : '✗ رد شده'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Individual View */}
          {suggestionViewMode === 'individual' && (
            <div className="space-y-4">
              {isLoadingRealtimeSuggestions ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : realtimeSuggestions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <Edit3 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No {suggestionFilter} suggestions</p>
                </div>
              ) : (
                realtimeSuggestions.map((suggestion) => (
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
          )}
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
            {isLoadingRealtimeRequests ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : realtimeRequests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {filter} requests</p>
              </div>
            ) : (
              (realtimeRequests as PermissionRequest[]).map((request) => (
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
            {isLoadingRealtimeClaims ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : realtimeClaims.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <UserCheck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {claimFilter} identity claims</p>
              </div>
            ) : (
              (realtimeClaims as IdentityClaimRequest[]).map((claim) => (
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
              users.map((u) => {
                const linkedPerson = u.person_id ? familyData.find(p => p.id === u.person_id) : null;
                
                return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4"
                >
                  {/* User info row */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {u.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                        {u.is_verified && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                        {linkedPerson && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-0.5 truncate max-w-[120px]">
                            <Link2 size={10} className="shrink-0" /> <span className="truncate">{linkedPerson.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions row - show for all users including self */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex-wrap">
                    {/* Link/Unlink button - check linkedPerson exists, not just person_id (handles deleted persons) */}
                    {!linkedPerson ? (
                      <button
                        onClick={() => { setLinkUserId(u.id); setShowLinkModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                      >
                        <Link2 size={14} />
                        Link
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Unlink ${u.email} from ${linkedPerson?.name || 'tree node'}?`)) {
                            ApiClient.unlinkIdentity(u.id).then(() => fetchUsers());
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                      >
                        <Link2 size={14} />
                        Unlink
                      </button>
                    )}
                    {/* Only show role/revoke buttons for other users */}
                    {u.email !== user?.email && (
                      <>
                        <button
                          onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                          Role
                        </button>
                        {u.role !== 'viewer' && (
                          <button
                            onClick={() => handleRevokeAccess(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <UserMinus size={14} />
                            Revoke
                          </button>
                        )}
                      </>
                    )}
                    {/* "This is you" label */}
                    {u.email === user?.email && (
                      <span className="text-xs text-slate-400 italic ml-auto">This is you</span>
                    )}
                  </div>
                </div>
              )})
            )}
          </div>
        </>
      )}

      {/* Role Modal - Inline to prevent focus loss */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Change Role for {selectedUser.email}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Current role: <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleBadgeColor(selectedUser.role)}`}>{getRoleLabel(selectedUser.role)}</span>
            </p>
            
            <div className="space-y-2 mb-6">
              {rolesList.map((role) => (
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
      )}

      {/* Link Modal - Inline to prevent focus loss */}
      {showLinkModal && linkTargetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Link User to Tree Node
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Linking <span className="font-medium text-slate-700 dark:text-slate-300">{linkTargetUser.email}</span> to a family tree member
            </p>
            
            {/* Instagram Input with Lookup */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Instagram size={16} className="text-pink-500" />
                Instagram Username (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInstagram}
                  onChange={(e) => {
                    setLinkInstagram(e.target.value.replace('@', ''));
                    setInstagramProfile(null);
                    setInstagramError(null);
                  }}
                  placeholder="username (without @)"
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleInstagramLookup}
                  disabled={!linkInstagram.trim() || isLookingUpInstagram}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  {isLookingUpInstagram ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Lookup
                </button>
              </div>
              
              {/* Instagram Profile Preview */}
              {instagramProfile && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={instagramProfile.avatar_url}
                      alt={instagramProfile.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-pink-300 dark:border-pink-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {instagramProfile.full_name || instagramProfile.username}
                        </p>
                        {instagramProfile.is_verified && (
                          <CheckCircle size={14} className="text-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-pink-600 dark:text-pink-400">@{instagramProfile.username}</p>
                      {instagramProfile.bio && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{instagramProfile.bio}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Profile found! Their photo will be used as avatar.
                  </p>
                </div>
              )}
              
              {/* Instagram Error */}
              {instagramError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400">{instagramError}</p>
                </div>
              )}
            </div>
            
            {/* Search persons */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Search size={16} />
                Search Tree Node
              </label>
              <input
                type="text"
                value={linkPersonSearch}
                onChange={(e) => setLinkPersonSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
            
            {/* Available persons */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {unlinkedPersons.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No unlinked persons found
                </p>
              ) : (
                unlinkedPersons.slice(0, 10).map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleLinkUserToPerson(person.id)}
                    disabled={isLinking}
                    className="w-full p-3 rounded-lg text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50 flex items-center gap-3"
                  >
                    <img
                      src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=6366f1&color=fff&size=40`}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{person.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{person.role}</p>
                    </div>
                    {isLinking && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                ))
              )}
              {unlinkedPersons.length > 10 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{unlinkedPersons.length - 10} more results. Refine your search.
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
              className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTab;
