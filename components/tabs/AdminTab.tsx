'use client';

import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Mail, MessageSquare } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { PermissionRequest } from '@/lib/types';

const AdminTab = () => {
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const fetchRequests = async () => {
    setIsLoading(true);
    const response = await ApiClient.getPermissionRequests(filter);
    if (response.data) {
      setRequests(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApprove = async (id: string) => {
    if (confirm('Approve this permission request? The user will be granted the requested role.')) {
      const response = await ApiClient.approvePermissionRequest(id);
      if (!response.error) {
        console.log('[Admin] Permission request approved, user role updated');
        fetchRequests();
      }
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('Reject this permission request?')) {
      const response = await ApiClient.rejectPermissionRequest(id);
      if (!response.error) {
        console.log('[Admin] Permission request rejected');
        fetchRequests();
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
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'editor':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Admin Panel</h2>
        <p className="text-slate-600 dark:text-slate-400">Manage permission requests and user access</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <XCircle size={16} className="inline mr-1" />
          Rejected
        </button>
      </div>

      {/* Requests List */}
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
                        Requested on {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                    {request.requested_role}
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
    </div>
  );
};

export default AdminTab;
