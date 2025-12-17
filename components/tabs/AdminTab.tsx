'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, XCircle, Clock, Mail, MessageSquare, 
  UserCheck, Link2, Shield, UserMinus,
  Edit3, Trash2, Plus, Eye
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { 
  PermissionRequest, IdentityClaimRequest, Suggestion, UserListItem, UserRole,
  getRoleLabel, getRoleDescription, canApprove
} from '@/lib/types';
import { useAppStore } from '@/lib/store';

type TabType = 'permissions' | 'identity' | 'suggestions' | 'users';

const AdminTab = () => {
  const user = useAppStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const canReviewSuggestions = user && canApprove(user.role);

  const [activeTab, setActiveTab] = useState<TabType>(canReviewSuggestions ? 'suggestions' : 'permissions');
  
  // Permission requests state
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Identity claims state
  const [identityClaims, setIdentityClaims] = useState<IdentityClaimRequest[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [claimFilter, setClaimFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [suggestionFilter, setSuggestionFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [suggestionNotes, setSuggestionNotes] = useState<Record<string, string>>({});

  // Users state (admin only)
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const response = await ApiClient.getPermissionRequests(filter);
    if (response.data) {
      setRequests(response.data);
    }
    setIsLoading(false);
  };

  const fetchIdentityClaims = async () => {
    setIsLoadingClaims(true);
    const response = await ApiClient.getIdentityClaims(claimFilter);
    if (response.data) {
      setIdentityClaims(response.data);
    } else {
      setIdentityClaims([]);
    }
    setIsLoadingClaims(false);
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const response = await ApiClient.getAllSuggestions(suggestionFilter);
    if (response.data) {
      setSuggestions(response.data);
    } else {
      setSuggestions([]);
    }
    setIsLoadingSuggestions(false);
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const response = await ApiClient.getAllUsers();
    if (response.data) {
      setUsers(response.data);
    } else {
      setUsers([]);
    }
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    if (activeTab === 'permissions' && isAdmin) {
      fetchRequests();
    }
  }, [filter, activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'identity' && isAdmin) {
      fetchIdentityClaims();
    }
  }, [claimFilter, activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab === 'suggestions' && canReviewSuggestions) {
      fetchSuggestions();
    }
  }, [suggestionFilter, activeTab, canReviewSuggestions]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {isAdmin ? 'Admin Panel' : 'Review Panel'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {isAdmin ? 'Manage requests, users, and contributions' : 'Review and manage contributions'}
        </p>
      </div>

      {/* Main Tab Selector */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700 overflow-x-auto">
        {canReviewSuggestions && (
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'suggestions'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 size={14} />
            Suggestions
          </button>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'permissions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users size={14} />
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'identity'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck size={14} />
              Identity
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
            {isLoadingSuggestions ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Edit3 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {suggestionFilter} suggestions</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white">
                          {getSuggestionTypeIcon(suggestion.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <p className="font-medium text-slate-800 dark:text-white">{suggestion.user_email}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(suggestion.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getSuggestionTypeBadge(suggestion.type)}`}>
                        {suggestion.type}
                      </span>
                    </div>

                    {/* Suggestion Details */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
                      {suggestion.type === 'add' && suggestion.person_data && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add new person:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-slate-500">Name:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.name}</span></div>
                            <div><span className="text-slate-500">Role:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.role}</span></div>
                            <div><span className="text-slate-500">Birth:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.birth}</span></div>
                            <div><span className="text-slate-500">Location:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.location}</span></div>
                          </div>
                          {suggestion.target_person_id && (
                            <p className="text-xs text-slate-500 mt-2">Parent ID: {suggestion.target_person_id}</p>
                          )}
                        </div>
                      )}

                      {suggestion.type === 'edit' && suggestion.target_person && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Edit: <span className="text-blue-600 dark:text-blue-400">{suggestion.target_person.name}</span>
                          </p>
                          {suggestion.person_data && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {suggestion.person_data.name && <div><span className="text-slate-500">New Name:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.name}</span></div>}
                              {suggestion.person_data.role && <div><span className="text-slate-500">New Role:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.role}</span></div>}
                              {suggestion.person_data.birth && <div><span className="text-slate-500">New Birth:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.birth}</span></div>}
                              {suggestion.person_data.location && <div><span className="text-slate-500">New Location:</span> <span className="text-slate-800 dark:text-white">{suggestion.person_data.location}</span></div>}
                            </div>
                          )}
                        </div>
                      )}

                      {suggestion.type === 'delete' && suggestion.target_person && (
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            Delete: <span className="font-bold">{suggestion.target_person.name}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {suggestion.target_person.role} • Born {suggestion.target_person.birth}
                          </p>
                        </div>
                      )}
                    </div>

                    {suggestion.message && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-700 dark:text-blue-300">{suggestion.message}</p>
                        </div>
                      </div>
                    )}

                    {suggestionFilter === 'pending' && (
                      <>
                        <div className="mb-3">
                          <input
                            type="text"
                            placeholder="Add review notes (optional)..."
                            value={suggestionNotes[suggestion.id] || ''}
                            onChange={(e) => setSuggestionNotes({ ...suggestionNotes, [suggestion.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveSuggestion(suggestion.id)}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectSuggestion(suggestion.id)}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </>
                    )}

                    {suggestionFilter !== 'pending' && (
                      <div className={`text-center py-2 rounded-lg font-medium text-sm ${
                        suggestionFilter === 'approved'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {suggestionFilter === 'approved' ? '✓ Approved & Applied' : '✗ Rejected'}
                        {suggestion.reviewer_email && (
                          <p className="text-xs mt-1 opacity-75">by {suggestion.reviewer_email}</p>
                        )}
                        {suggestion.review_notes && (
                          <p className="text-xs mt-1 opacity-75">Notes: {suggestion.review_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {filter} requests</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {request.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <p className="font-medium text-slate-800 dark:text-white">{request.user_email}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(request.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                        {getRoleLabel(request.requested_role)}
                      </span>
                    </div>

                    {request.message && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-300">{request.message}</p>
                        </div>
                      </div>
                    )}

                    {filter === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}

                    {filter !== 'pending' && (
                      <div className={`text-center py-2 rounded-lg font-medium text-sm ${
                        filter === 'approved'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {filter === 'approved' ? '✓ Approved' : '✗ Rejected'}
                      </div>
                    )}
                  </div>
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
            {isLoadingClaims ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : identityClaims.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <UserCheck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No {claimFilter} identity claims</p>
              </div>
            ) : (
              identityClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                          {claim.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            <p className="font-medium text-slate-800 dark:text-white">{claim.user_email}</p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(claim.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Claims to be:</p>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">{claim.person_name}</p>
                    </div>

                    {claim.message && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-600 dark:text-slate-300">{claim.message}</p>
                        </div>
                      </div>
                    )}

                    {claimFilter === 'pending' && (
                      <>
                        <div className="mb-3">
                          <input
                            type="text"
                            placeholder="Add review notes (optional)..."
                            value={reviewNotes[claim.id] || ''}
                            onChange={(e) => setReviewNotes({ ...reviewNotes, [claim.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveClaim(claim.id)}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Link2 size={16} />
                            Link User
                          </button>
                          <button
                            onClick={() => handleRejectClaim(claim.id)}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </>
                    )}

                    {claimFilter !== 'pending' && (
                      <div className={`text-center py-2 rounded-lg font-medium text-sm ${
                        claimFilter === 'approved'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      }`}>
                        {claimFilter === 'approved' ? '✓ Linked to Tree' : '✗ Rejected'}
                        {claim.review_notes && (
                          <p className="text-xs mt-1 opacity-75">Notes: {claim.review_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
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
